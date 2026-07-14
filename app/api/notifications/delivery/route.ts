/**
 * POST /api/notifications/delivery
 * ─────────────────────────────────
 * Mobile app reports delivery/click events back to the ERP.
 * Called from the mobile app when:
 *  - A notification is received in background (delivered)
 *  - User taps a notification (clicked)
 *
 * Body: { notificationId: string, status: "delivered"|"clicked" }
 * Auth: JWT cookie
 */

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { NotificationRepository, NotificationDeliveryLogRepository } from "@/repositories/notification.repository";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, status, fcmToken } = body;

    if (!notificationId || !status) {
      return NextResponse.json(
        { success: false, error: "notificationId and status are required" },
        { status: 400 }
      );
    }

    if (!["delivered", "clicked"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "status must be 'delivered' or 'clicked'" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { status };
    if (status === "delivered") updateData.delivered_at = now;
    if (status === "clicked") {
      updateData.clicked_at = now;
      
      const notificationRepo = new NotificationRepository();
      await notificationRepo.update(notificationId, {
        is_read: true,
        read_at: now,
      });
    }

    const deliveryLogRepo = new NotificationDeliveryLogRepository();
    const query: Record<string, unknown> = {
      notification_id: notificationId,
      user_id: user.id,
    };
    if (fcmToken) query.fcm_token = fcmToken;

    // Use supabase client directly for updateMany equivalent
    const { error } = await deliveryLogRepo.getClient()
        .from('notification_delivery_logs')
        .update(updateData)
        .match(query);
        
    if (error) throw error;

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[POST /api/notifications/delivery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
    }

    const deliveryLogRepo = new NotificationDeliveryLogRepository();
    const logsData = await deliveryLogRepo.find({ notification_id: notificationId });

    const stats = {
      total: logsData.length,
      sent: logsData.filter((l: any) => l.status === "sent").length,
      delivered: logsData.filter((l: any) => l.status === "delivered").length,
      clicked: logsData.filter((l: any) => l.status === "clicked").length,
      failed: logsData.filter((l: any) => l.status === "failed").length,
      pending: logsData.filter((l: any) => l.status === "pending").length,
    };
    
    const logs = logsData.map((l: any) => ({
        _id: l.id,
        id: l.id,
        userId: l.user_id, // we should ideally join users here
        status: l.status,
        sentAt: l.sent_at,
        deliveredAt: l.delivered_at,
        clickedAt: l.clicked_at,
        error: l.error_message
    }));

    return NextResponse.json({ success: true, stats, logs });
  } catch (error) {
    console.error("[GET /api/notifications/delivery]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch delivery stats" }, { status: 500 });
  }
}
