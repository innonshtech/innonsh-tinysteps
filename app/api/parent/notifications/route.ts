import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { NotificationRepository } from "@/repositories/notification.repository";
import { getParentStudentIds } from "@/lib/parent";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const parentEmail = (parent as { email?: string }).email;
  const studentIds = await getParentStudentIds(parent.id, parentEmail);
  const allIds = [...new Set([parent.id, ...studentIds])];

  const repo = new NotificationRepository();
  const notifications = await repo.find({ recipient_id: { $in: allIds } }, { sort: { field: 'created_at', ascending: false } });

  const mappedNotifications = notifications.map(n => ({
    ...n,
    _id: n.id,
    createdAt: n.created_at
  }));

  return NextResponse.json({ success: true, notifications: mappedNotifications });
}
