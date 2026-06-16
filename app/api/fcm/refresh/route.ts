/**
 * PUT /api/fcm/refresh
 * ────────────────────
 * Called when Firebase issues a new FCM token (replaces old one).
 * Deactivates the old token and activates the new one atomically.
 *
 * Body: { oldToken: string, newToken: string }
 * Auth: JWT cookie
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserFcmToken from "@/models/UserFcmToken";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    await connectDB();

    const cookie = req.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { oldToken, newToken, platform = "android", deviceId, appVersion } = body;

    if (!newToken) {
      return NextResponse.json({ success: false, error: "newToken is required" }, { status: 400 });
    }

    // Deactivate old token
    if (oldToken) {
      await UserFcmToken.findOneAndUpdate(
        { token: oldToken, userId: user.id },
        { isActive: false }
      );
    }

    // Activate / create new token
    const savedToken = await UserFcmToken.findOneAndUpdate(
      { token: newToken },
      {
        userId: user.id,
        token: newToken,
        platform,
        deviceId,
        appVersion,
        isActive: true,
        lastSeen: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, tokenId: savedToken._id });
  } catch (error) {
    console.error("[PUT /api/fcm/refresh]", error);
    return NextResponse.json({ success: false, error: "Failed to refresh FCM token" }, { status: 500 });
  }
}
