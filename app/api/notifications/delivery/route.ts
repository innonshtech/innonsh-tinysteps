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
import { connectDB } from "@/lib/db";
import NotificationDeliveryLog from "@/models/NotificationDeliveryLog";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

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

    const now = new Date();
    const updateData: Record<string, unknown> = { status };
    if (status === "delivered") updateData.deliveredAt = now;
    if (status === "clicked") {
      updateData.clickedAt = now;
      // Also mark notification as read when clicked
      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: now,
      });
    }

    // Update delivery log(s) for this notification + user
    const query: Record<string, unknown> = {
      notificationId,
      userId: user.id,
    };
    if (fcmToken) query.fcmToken = fcmToken;

    await NotificationDeliveryLog.updateMany(query, updateData);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[POST /api/notifications/delivery]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/delivery?notificationId=xxx
 * Admin only — view delivery stats for a notification.
 */
export async function GET(req: Request) {
  try {
    await connectDB();

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

    const logs = await NotificationDeliveryLog.find({ notificationId })
      .populate("userId", "name email")
      .lean();

    const stats = {
      total: logs.length,
      sent: logs.filter((l) => l.status === "sent").length,
      delivered: logs.filter((l) => l.status === "delivered").length,
      clicked: logs.filter((l) => l.status === "clicked").length,
      failed: logs.filter((l) => l.status === "failed").length,
      pending: logs.filter((l) => l.status === "pending").length,
    };

    return NextResponse.json({ success: true, stats, logs });
  } catch (error) {
    console.error("[GET /api/notifications/delivery]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch delivery stats" }, { status: 500 });
  }
}
