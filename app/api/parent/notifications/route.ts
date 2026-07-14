import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { NotificationRepository } from "@/repositories/notification.repository";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  // find all children
  const { data: mappings } = await supabaseAdmin.from('student_parents')
    .select('student_id')
    .eq('parent_user_id', parent.id);

  const studentIds = mappings?.map(m => m.student_id) || [];
  
  // The parent also gets notifications sent directly to their user ID
  const allIds = [parent.id, ...studentIds];

  const repo = new NotificationRepository();
  const notifications = await repo.find({ recipient_id: { $in: allIds } }, { sort: { field: 'created_at', ascending: false } });

  const mappedNotifications = notifications.map(n => ({
    ...n,
    _id: n.id,
    createdAt: n.created_at
  }));

  return NextResponse.json({ success: true, notifications: mappedNotifications });
}
