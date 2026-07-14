import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { supabaseAdmin } from "@/lib/supabase";

interface LogParams {
  actorId?: string;
  actorEmail?: string; // Optional - will try to fetch if not provided
  actorRole: string;
  action: string; // "create:student", "update:teacher", "delete:class", etc.
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin action (create, update, delete) to the database
 */
export async function logAdminActivity(params: LogParams) {
  try {
    let email = params.actorEmail;

    // If email not provided, try to fetch it from users table
    if (!email && params.actorId) {
      try {
        const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', params.actorId).single();
        if (user) {
          email = user.email;
        } else {
          email = "unknown";
        }
      } catch {
        // Silently fail - use "unknown" for email
        email = "unknown";
      }
    }

    const logRepo = new LogActivityRepository();
    const entry = await logRepo.create({
      actor_id: params.actorId,
      actor_email: email || "unknown",
      actor_role: params.actorRole,
      action: params.action,
      result: "success",
      message: params.message,
      metadata: params.metadata || {},
    });
    return entry;
  } catch (error) {
    console.error("[logAdminActivity] Error:", error);
    // Don't throw — silently fail so admin operations aren't blocked
  }
}
