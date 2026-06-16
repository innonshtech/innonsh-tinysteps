import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import FeeTransaction from "@/models/FeeTransaction";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  await connectDB();

  const { studentId } = await context.params;

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);
  if (!student) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // 1. Fetch attendance
  const attendance = await Attendance.find({ studentId }).sort({ date: -1 }).lean();

  // 2. Fetch fees
  const fees = await FeeTransaction.find({ studentId }).sort({ createdAt: -1 }).lean();

  // 3. Fetch notifications (global + class + student specific)
  const notifications = await Notification.find({
    $or: [
      { type: "global" },
      { classId: student.classId },
      { studentId: studentId }
    ]
  }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ success: true, data: { attendance, fees, notifications } });
}
