/**
 * lib/notification.service.ts
 * ────────────────────────────
 * Orchestrates the full notification pipeline when an event is published:
 *   1. Determines target audience (parents by student's classId)
 *   2. Creates in-app Notification documents (one per parent)
 *   3. Fetches active FCM tokens for those parents
 *   4. Creates pending delivery logs
 *   5. Dispatches FCM push notifications (batched)
 *   6. Updates delivery logs and event.fcmSent
 *
 * Used by: /api/events PUT (publish hook)
 * Can also be called manually via /api/notifications/send
 */

import { supabaseAdmin } from "@/lib/supabase";
import {
  sendToTokens,
  createDeliveryLogs,
  getActiveTokensForUsers,
  type FCMPayload,
} from "@/lib/fcm.service";

/** Maps ERP event types to FCM categories and Android channel IDs */
const EVENT_TYPE_TO_FCM: Record<string, { fcmCategory: string; channelId: string; priority: "high" | "normal" }> = {
  holiday:        { fcmCategory: "holiday",     channelId: "tinysteps_holiday",     priority: "high"   },
  competition:    { fcmCategory: "sports",      channelId: "tinysteps_sports",      priority: "normal" },
  workshop:       { fcmCategory: "academic",    channelId: "tinysteps_academic",    priority: "high"   },
  meeting:        { fcmCategory: "academic",    channelId: "tinysteps_academic",    priority: "high"   },
  celebration:    { fcmCategory: "general",     channelId: "tinysteps_general",     priority: "normal" },
  notification:   { fcmCategory: "circular",    channelId: "tinysteps_circular",    priority: "normal" },
  exam:           { fcmCategory: "exam",        channelId: "tinysteps_exam",        priority: "high"   },
  fee:            { fcmCategory: "fee_reminder",channelId: "tinysteps_fee",         priority: "high"   },
  attendance:     { fcmCategory: "attendance",  channelId: "tinysteps_attendance",  priority: "high"   },
  emergency:      { fcmCategory: "emergency",   channelId: "tinysteps_emergency",   priority: "high"   },
};

export interface EventDoc {
  _id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate?: Date;
  targetAudience: string;
  classIds?: string[];
  notify: boolean;
  notificationType: string;
  location?: string;
  image?: string;
}

/**
 * Main entry point — called when an event is published.
 * Runs asynchronously so it does not block the API response.
 */
export async function dispatchEventNotification(eventDoc: EventDoc): Promise<void> {
  try {
    if (!eventDoc.notify) {
      console.log(`[NotificationService] Skipping — notify=false for event ${eventDoc._id}`);
      return;
    }

    // Step 1: Resolve target parent users
    const parentUserIds = await resolveTargetParents(eventDoc);
    if (parentUserIds.length === 0) {
      console.log(`[NotificationService] No target parents found for event ${eventDoc._id}`);
      return;
    }

    console.log(`[NotificationService] Dispatching to ${parentUserIds.length} parent(s) for event: ${eventDoc.title}`);

    const fcmMeta = EVENT_TYPE_TO_FCM[eventDoc.eventType] || EVENT_TYPE_TO_FCM["notification"];

    // Step 2: Build notification message
    const notifTitle = eventDoc.title;
    const notifBody = eventDoc.description
      ? eventDoc.description.substring(0, 160)
      : `New ${eventDoc.eventType} event from Podar TinySteps`;

    const fcmData: Record<string, string> = {
      screen: "Events",
      eventId: String(eventDoc._id),
      eventType: eventDoc.eventType,
      category: fcmMeta.fcmCategory,
    };

    // Step 3: Create in-app Notification documents (one per parent)
    const notifications = parentUserIds.map((userId) => ({
      recipient_id: userId,
      type: _mapEventTypeToNotifType(eventDoc.eventType),
      fcm_category: fcmMeta.fcmCategory,
      title: notifTitle,
      message: notifBody,
      related_id: eventDoc._id,
      related_model: "Event",
      priority: fcmMeta.priority === "high" ? "high" : "normal",
      action_url: `/events/${eventDoc._id}`,
      icon: fcmMeta.fcmCategory,
      metadata: {
        eventId: String(eventDoc._id),
        eventType: eventDoc.eventType,
        startDate: eventDoc.startDate?.toISOString(),
        location: eventDoc.location,
        image: eventDoc.image,
      },
      fcm_sent: false,
    }));

    let savedNotifications: any[];
    try {
      const { data } = await supabaseAdmin.from('notifications').insert(notifications).select();
      if (!data) throw new Error("No data returned from insert");
      savedNotifications = data;
    } catch (err) {
      console.error("[NotificationService] insertMany notifications error:", err);
      return;
    }

    // Step 4: Determine if push is needed
    const needsPush = ["in-app", "all"].includes(eventDoc.notificationType);
    if (!needsPush) {
      console.log(`[NotificationService] Skipping push — notificationType=${eventDoc.notificationType}`);
      await _markEventFcmSent(String(eventDoc._id), parentUserIds.length, false);
      return;
    }

    // Step 5: Fetch active FCM tokens
    const { tokens, userTokenMap } = await getActiveTokensForUsers(
      parentUserIds.map((id) => String(id))
    );

    if (tokens.length === 0) {
      console.log("[NotificationService] No active FCM tokens found — in-app only.");
      await _markEventFcmSent(String(eventDoc._id), parentUserIds.length, false);
      return;
    }

    // Step 6: Create pending delivery logs (one per token, linked to first notification)
    // In practice link to each user's own notification
    const notifMap = new Map<string, string>(); // userId → notificationId
    savedNotifications.forEach((n, i) => {
      notifMap.set(String(parentUserIds[i]), String(n.id));
    });

    // Create delivery logs
    for (const [token, userId] of userTokenMap.entries()) {
      const notifId = notifMap.get(userId);
      if (notifId) {
        await createDeliveryLogs(notifId, userId, [token]);
      }
    }

    // Step 7: Build FCM payload
    const fcmPayload: FCMPayload = {
      title: notifTitle,
      body: notifBody,
      data: fcmData,
      imageUrl: eventDoc.image,
      priority: fcmMeta.priority,
      channelId: fcmMeta.channelId,
    };

    // Step 8: Send push (batched, with delivery logging)
    const result = await sendToTokens(tokens, fcmPayload, undefined, userTokenMap);

    console.log(
      `[NotificationService] Event "${eventDoc.title}" — ` +
      `✅ ${result.successCount} sent, ❌ ${result.failureCount} failed`
    );

    // Step 9: Mark in-app notifications as fcmSent
    await supabaseAdmin.from('notifications')
      .update({ fcm_sent: true, fcm_sent_at: new Date().toISOString() })
      .in('id', savedNotifications.map((n) => n.id));

    // Step 10: Update event
    await _markEventFcmSent(String(eventDoc._id), parentUserIds.length, true);
  } catch (err) {
    console.error("[NotificationService] dispatchEventNotification error:", err);
  }
}

/**
 * Create and send a manual notification to specific users (admin action).
 */
export async function sendManualNotification(params: {
  userIds: string[];
  title: string;
  message: string;
  type: string;
  fcmCategory?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  relatedId?: string;
  relatedModel?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ notificationsCreated: number; fcmSent: number; fcmFailed: number }> {

  const fcmCat = params.fcmCategory || "general";
  const channelId = `tinysteps_${fcmCat}`;
  const pushPriority: "high" | "normal" = (params.priority === "urgent" || params.priority === "high") ? "high" : "normal";

  // Create in-app notifications
  const notifications = params.userIds.map((userId) => ({
    recipient_id: userId,
    type: params.type,
    fcm_category: fcmCat,
    title: params.title,
    message: params.message,
    related_id: params.relatedId,
    related_model: params.relatedModel,
    priority: params.priority || "normal",
    metadata: params.metadata,
    fcm_sent: false,
  }));

  const { data: saved } = await supabaseAdmin.from('notifications').insert(notifications).select();
  const count = saved ? saved.length : 0;

  // Fetch tokens and send
  const { tokens, userTokenMap } = await getActiveTokensForUsers(params.userIds);
  if (tokens.length === 0) {
    return { notificationsCreated: count, fcmSent: 0, fcmFailed: 0 };
  }

  const result = await sendToTokens(tokens, {
    title: params.title,
    body: params.message,
    data: { screen: "Notifications", category: fcmCat },
    priority: pushPriority,
    channelId,
  }, undefined, userTokenMap);

  return {
    notificationsCreated: count,
    fcmSent: result.successCount,
    fcmFailed: result.failureCount,
  };
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Resolve which parent User IDs should receive the notification
 * based on event.targetAudience and event.classIds.
 */
async function resolveTargetParents(event: EventDoc): Promise<string[]> {
  // If audience excludes parents entirely, return empty
  if (event.targetAudience === "teachers" || event.targetAudience === "staff") {
    return [];
  }

  let query = supabaseAdmin.from('students').select('id');

  // If specific classes are targeted, filter by classId
  if (event.classIds && event.classIds.length > 0) {
    query = query.in('class_id', event.classIds);
  }

  const { data: students } = await query;
  
  if (students && students.length > 0) {
      return students.map(s => s.id);
  }

  // Fallback: get all students if none matched (should rarely happen unless class is empty)
  const { data: allStudents } = await supabaseAdmin.from('students').select('id');
  return allStudents ? allStudents.map(s => s.id) : [];
}

async function _markEventFcmSent(
  eventId: string,
  recipientCount: number,
  fcmSent: boolean
): Promise<void> {
  await supabaseAdmin.from('events').update({
    fcm_sent: fcmSent,
    fcm_sent_at: new Date().toISOString(),
    fcm_recipient_count: recipientCount,
  }).eq('id', eventId);
}

/** Maps ERP eventType to Notification.type enum */
function _mapEventTypeToNotifType(eventType: string): string {
  const map: Record<string, string> = {
    holiday:      "event",
    competition:  "event",
    workshop:     "exam",
    meeting:      "event",
    celebration:  "event",
    notification: "announcement",
    exam:         "exam",
    fee:          "fee",
    attendance:   "attendance",
    emergency:    "emergency",
    circular:     "circular",
    sports:       "event",
    academic:     "exam",
  };
  return map[eventType] || "event";
}
