/**
 * POST /api/notifications/send
 * ─────────────────────────────
 * Admin-only: manually send a push notification to target users.
 *
 * Body:
 * {
 *   userIds?: string[]         // specific user IDs (if omitted, sends to all parents)
 *   targetRole?: "parent" | "teacher" | "all"
 *   title: string
 *   message: string
 *   type: string               // notification type (event, fee, etc.)
 *   fcmCategory?: string       // FCM channel category
 *   priority?: "low"|"normal"|"high"|"urgent"
 *   relatedId?: string
 *   relatedModel?: string
 *   metadata?: object
 * }
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { sendManualNotification } from "@/lib/notification.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookie = req.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      userIds,
      targetRole = "parent",
      title,
      message,
      type = "announcement",
      fcmCategory = "general",
      priority = "normal",
      relatedId,
      relatedModel,
      metadata,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "title and message are required" },
        { status: 400 }
      );
    }

    // Resolve target user IDs
    let targetUserIds: string[] = userIds || [];
    if (!targetUserIds.length) {
      const roleFilter = targetRole === "all" ? {} : { role: targetRole };
      const users = await User.find(roleFilter).select("_id").lean() as { _id: { toString(): string } }[];
      targetUserIds = users.map((u) => u._id.toString());
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ success: false, error: "No target users found" }, { status: 400 });
    }

    const result = await sendManualNotification({
      userIds: targetUserIds,
      title,
      message,
      type,
      fcmCategory,
      priority,
      relatedId,
      relatedModel,
      metadata,
    });

    return NextResponse.json({
      success: true,
      ...result,
      targetCount: targetUserIds.length,
    });
  } catch (error) {
    console.error("[POST /api/notifications/send]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
