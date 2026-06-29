import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { FeeTransactionRepository } from "@/repositories/fee.repository";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
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
  const attendanceRepo = new AttendanceRepository();
  const attendance = await attendanceRepo.find({ student_id: studentId }, { sort: { field: 'date', ascending: false } });

  // 2. Fetch fees
  const feeRepo = new FeeTransactionRepository();
  const fees = await feeRepo.find({ student_id: studentId }, { sort: { field: 'created_at', ascending: false } });

  // 3. Fetch notifications (global + class + student specific)
  // Our schema sends notifications directly to recipient_id
  const notifRepo = new NotificationRepository();
  const notifications = await notifRepo.find({ recipient_id: studentId }, { sort: { field: 'created_at', ascending: false } });

  // Map to frontend expected formats
  const mappedAttendance = attendance.map(a => ({
    ...a,
    _id: a.id,
    studentId: a.student_id,
    classId: a.class_id
  }));

  const mappedFees = fees.map(f => ({
    ...f,
    _id: f.id,
    amountDue: f.amount_due,
    amountPaid: f.amount_paid,
    fineAmount: f.fine_amount,
    createdAt: f.created_at
  }));

  const mappedNotifs = notifications.map(n => ({
    ...n,
    _id: n.id,
    createdAt: n.created_at
  }));

  return NextResponse.json({ success: true, data: { attendance: mappedAttendance, fees: mappedFees, notifications: mappedNotifs } });
}
