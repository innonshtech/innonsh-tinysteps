import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";
import { AttendanceRepository } from "@/repositories/attendance.repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await context.params;   // ✅ IMPORTANT FIX

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);
  if (!student) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const repo = new AttendanceRepository();
  const attendance = await repo.find({ student_id: studentId });

  const mappedAttendance = attendance.map(a => ({
    ...a,
    _id: a.id,
    studentId: a.student_id,
    classId: a.class_id
  }));

  return NextResponse.json({ success: true, attendance: mappedAttendance });
}
