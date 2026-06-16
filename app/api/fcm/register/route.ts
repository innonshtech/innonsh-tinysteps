/**
 * POST /api/fcm/register
 * ──────────────────────
 * Register a device FCM token for the authenticated parent user.
 * Called on every app login and after token refresh.
 *
 * Body: { token: string, platform: "android"|"ios", deviceId?: string, appVersion?: string }
 * Auth: JWT cookie (same as all other ERP APIs)
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserFcmToken from "@/models/UserFcmToken";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Authenticate
    const cookie = req.headers.get("cookie") || "";
    const token = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token: fcmToken, platform = "android", deviceId, appVersion } = body;

    if (!fcmToken || typeof fcmToken !== "string" || fcmToken.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "FCM token is required" },
        { status: 400 }
      );
    }

    // Upsert: if token already exists, reactivate and update lastSeen.
    // If it's a new token for the same deviceId, deactivate old one first.
    if (deviceId) {
      // Deactivate any OTHER active tokens for this device (handles token refresh)
      await UserFcmToken.updateMany(
        {
          userId: user.id,
          deviceId,
          token: { $ne: fcmToken },
          isActive: true,
        },
        { isActive: false }
      );
    }

    const savedToken = await UserFcmToken.findOneAndUpdate(
      { token: fcmToken },
      {
        userId: user.id,
        token: fcmToken,
        platform,
        deviceId,
        appVersion,
        isActive: true,
        lastSeen: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { success: true, tokenId: savedToken._id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/fcm/register]", error);
    return NextResponse.json(
      { success: false, error: "Failed to register FCM token" },
      { status: 500 }
    );
  }
}
