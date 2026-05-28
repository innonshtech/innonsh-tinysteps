import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  // find all children
  const students = await Student.find({
    "parents.parentId": parent.id,
  }).lean();

  const classIds = students.map((s) => s.classId);

  // return notifications for class + global
  const notifications = await Notification.find({
    $or: [
      { type: "global" },
      { classId: { $in: classIds } },
      { studentId: { $in: students.map((s) => s._id) } }
    ]
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, notifications });
}
