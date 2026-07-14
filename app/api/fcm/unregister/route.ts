/**
 * DELETE /api/fcm/unregister
 * ──────────────────────────
 * Deactivate a device token on logout or app uninstall.
 * Prevents push delivery to devices that are no longer authenticated.
 *
 * Body: { token: string }  OR  Query: ?token=<fcmToken>
 * Auth: JWT cookie
 */

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const jwtToken = cookie.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(jwtToken);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Accept token from query param or body
    const { searchParams } = new URL(req.url);
    let fcmToken = searchParams.get("token");

    if (!fcmToken) {
      try {
        const body = await req.json();
        fcmToken = body.token;
      } catch {
        // No body is fine — deactivate ALL tokens for this user
      }
    }

    if (fcmToken) {
      // Deactivate specific token
      await supabaseAdmin.from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('token', fcmToken)
        .eq('user_id', user.id);
    } else {
      // Logout: deactivate ALL active tokens for this user
      await supabaseAdmin.from('user_fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);
    }

    return NextResponse.json({ success: true, message: "Token(s) deactivated" });
  } catch (error) {
    console.error("[DELETE /api/fcm/unregister]", error);
    return NextResponse.json({ success: false, error: "Failed to unregister token" }, { status: 500 });
  }
}
