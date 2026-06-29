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
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(req: Request) {
  try {
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
      await supabaseAdmin.from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('token', oldToken)
        .eq('user_id', user.id);
    }

    // Activate / create new token
    const { data: savedToken, error } = await supabaseAdmin.from('user_fcm_tokens')
      .upsert(
        {
          user_id: user.id,
          token: newToken,
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

    return NextResponse.json({ success: true, tokenId: savedToken.id });
  } catch (error) {
    console.error("[PUT /api/fcm/refresh]", error);
    return NextResponse.json({ success: false, error: "Failed to refresh FCM token" }, { status: 500 });
  }
}
