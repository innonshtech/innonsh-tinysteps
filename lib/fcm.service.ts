import { getMessaging } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase";
import type { MulticastMessage, BatchResponse } from "firebase-admin/messaging";

export interface FCMPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  priority?: "high" | "normal";
  // Android-specific
  channelId?: string; // Android notification channel
  // Badge count for iOS (future)
  badge?: number;
}

export interface FCMSendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  messageIds: string[];
  errors: { token: string; error: string }[];
}

// FCM max tokens per multicast request
const FCM_BATCH_SIZE = 500;
// Max retry attempts for failed sends
const MAX_RETRY_ATTEMPTS = 3;
// Errors that mean the token is permanently invalid and should be deactivated
const INVALID_TOKEN_ERRORS = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
];

/**
 * Send a push notification to a list of FCM tokens.
 * Automatically splits into batches of 500 (Firebase limit).
 */
export async function sendToTokens(
  tokens: string[],
  payload: FCMPayload,
  notificationId?: string,
  userTokenMap?: Map<string, string> // token → userId mapping for delivery logs
): Promise<FCMSendResult> {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [], messageIds: [], errors: [] };
  }

  const uniqueTokens = [...new Set(tokens)]; // deduplicate
  const result: FCMSendResult = {
    successCount: 0,
    failureCount: 0,
    invalidTokens: [],
    messageIds: [],
    errors: [],
  };

  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < uniqueTokens.length; i += FCM_BATCH_SIZE) {
    batches.push(uniqueTokens.slice(i, i + FCM_BATCH_SIZE));
  }

  const messaging = getMessaging();

  for (const batch of batches) {
    const message: MulticastMessage = {
      tokens: batch,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      android: {
        priority: payload.priority === "high" ? "high" : "normal",
        notification: {
          channelId: payload.channelId || "tinysteps_general",
          priority: payload.priority === "high" ? "max" : "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      // Custom data payload — available in onMessage handler
      data: {
        ...(payload.data || {}),
        notificationId: notificationId || "",
        channelId: payload.channelId || "tinysteps_general",
        priority: payload.priority || "normal",
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response: BatchResponse = await messaging.sendEachForMulticast(message);

      response.responses.forEach((resp, index) => {
        const token = batch[index];
        if (resp.success) {
          result.successCount++;
          result.messageIds.push(resp.messageId || "");
          // Update delivery log to sent
          if (notificationId && userTokenMap) {
            _updateDeliveryLog(notificationId, token, "sent", resp.messageId).catch(
              console.error
            );
          }
        } else {
          result.failureCount++;
          const errorCode = resp.error?.code || "unknown";
          result.errors.push({ token, error: errorCode });

          if (INVALID_TOKEN_ERRORS.includes(errorCode)) {
            result.invalidTokens.push(token);
          }

          if (notificationId && userTokenMap) {
            _updateDeliveryLog(notificationId, token, "failed", undefined, errorCode, resp.error?.message).catch(
              console.error
            );
          }
        }
      });
    } catch (batchError: unknown) {
      console.error("[FCMService] Batch send error:", batchError);
      // Mark all tokens in this batch as failed
      batch.forEach((token) => {
        result.failureCount++;
        result.errors.push({ token, error: "batch_send_failed" });
      });
    }
  }

  // Deactivate invalid tokens in background
  if (result.invalidTokens.length > 0) {
    _deactivateInvalidTokens(result.invalidTokens).catch(console.error);
  }

  return result;
}

/**
 * Update delivery log status for a specific notification + token pair.
 */
async function _updateDeliveryLog(
  notificationId: string,
  fcmToken: string,
  status: "sent" | "failed",
  fcmMessageId?: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = { status, sent_at: new Date() };
    if (fcmMessageId) updateData.fcm_message_id = fcmMessageId;
    if (errorCode) updateData.error_code = errorCode;
    if (errorMessage) updateData.error_message = errorMessage;

    await supabaseAdmin.from('notification_delivery_logs')
      .update(updateData)
      .eq('notification_id', notificationId)
      .eq('fcm_token', fcmToken)
      .eq('status', 'pending');
  } catch (err) {
    console.error("[FCMService] Failed to update delivery log:", err);
  }
}

/**
 * Bulk-create pending delivery log entries before sending.
 * Call this BEFORE sendToTokens so logs exist for tracking.
 */
export async function createDeliveryLogs(
  notificationId: string,
  userId: string,
  tokens: string[]
): Promise<void> {
  try {
    const logs = tokens.map((fcmToken) => ({
      notification_id: notificationId,
      user_id: userId,
      fcm_token: fcmToken,
      status: "pending",
    }));
    await supabaseAdmin.from('notification_delivery_logs').insert(logs);
  } catch (err) {
    console.error("[FCMService] createDeliveryLogs error:", err);
  }
}

/**
 * Mark invalid tokens as inactive so they won't be used for future pushes.
 */
async function _deactivateInvalidTokens(tokens: string[]): Promise<void> {
  try {
    await supabaseAdmin.from('user_fcm_tokens')
      .update({ is_active: false })
      .in('token', tokens);
    console.log(`[FCMService] Deactivated ${tokens.length} invalid token(s).`);
  } catch (err) {
    console.error("[FCMService] Failed to deactivate invalid tokens:", err);
  }
}

/**
 * Retry failed delivery logs.
 * Finds pending/failed logs with retryCount < MAX_RETRY_ATTEMPTS
 * and attempts to re-send. Called by a scheduled job or on-demand.
 */
export async function retryFailedNotifications(): Promise<{ retried: number; succeeded: number }> {
  const now = new Date().toISOString();

  const { data: failedLogs } = await supabaseAdmin.from('notification_delivery_logs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', MAX_RETRY_ATTEMPTS)
    .or(`next_retry_at.lte.${now},next_retry_at.is.null`)
    .limit(100);

  if (!failedLogs || failedLogs.length === 0) return { retried: 0, succeeded: 0 };

  let succeeded = 0;

  for (const log of failedLogs) {
    try {
      const { data: notification } = await supabaseAdmin.from('notifications').select('*').eq('id', log.notification_id).single();
      if (!notification) continue;

      const result = await sendToTokens(
        [log.fcm_token],
        {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: String(log.notification_id),
            ...(notification.metadata as Record<string, string> || {}),
          },
          priority: (notification.priority === "urgent" || notification.priority === "high") ? "high" : "normal",
          channelId: `tinysteps_${notification.fcm_category || "general"}`,
        }
      );

      const nextRetryCount = (log.retry_count || 0) + 1;
      // Exponential back-off: 5min, 15min, 45min
      const backoffMs = Math.pow(3, nextRetryCount) * 5 * 60 * 1000;

      await supabaseAdmin.from('notification_delivery_logs')
        .update({
          status: result.successCount > 0 ? "sent" : "failed",
          retry_count: nextRetryCount,
          next_retry_at: result.successCount === 0 ? new Date(Date.now() + backoffMs).toISOString() : null,
        })
        .eq('id', log.id);

      if (result.successCount > 0) succeeded++;
    } catch (err) {
      console.error("[FCMService] Retry error for log", log.id, err);
    }
  }

  return { retried: failedLogs.length, succeeded };
}

/**
 * Fetch active FCM tokens for a list of userIds.
 * Returns { userId → tokens[] } map.
 */
export async function getActiveTokensForUsers(
  userIds: string[]
): Promise<{ tokens: string[]; userTokenMap: Map<string, string> }> {
  const { data: tokenDocs } = await supabaseAdmin.from('user_fcm_tokens')
    .select('user_id, token')
    .in('user_id', userIds)
    .eq('is_active', true);

  const tokens: string[] = [];
  const userTokenMap = new Map<string, string>(); // token → userId

  if (tokenDocs) {
      tokenDocs.forEach((doc: any) => {
        tokens.push(doc.token);
        userTokenMap.set(doc.token, String(doc.user_id));
      });
  }

  return { tokens, userTokenMap };
}
