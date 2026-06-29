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
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
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

    if (deviceId) {
      // Deactivate any OTHER active tokens for this device
      await supabaseAdmin.from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('device_id', deviceId)
        .neq('token', fcmToken)
        .eq('is_active', true);
    }

    // Upsert token
    const { data: savedToken, error } = await supabaseAdmin.from('user_fcm_tokens')
      .upsert(
        {
          user_id: user.id,
          token: fcmToken,
          platform,
          device_id: deviceId,
          app_version: appVersion,
          is_active: true,
          last_seen: new Date().toISOString()
        },
        { onConflict: 'token' }
      )
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, tokenId: savedToken.id },
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
