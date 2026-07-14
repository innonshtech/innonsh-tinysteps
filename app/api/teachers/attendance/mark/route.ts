import { NextResponse } from "next/server";
import { AttendanceMarkZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import { AttendanceRepository } from "@/repositories/attendance.repository";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["teacher", "admin"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = AttendanceMarkZ.parse(body);

    const date = parsed.date ? new Date(parsed.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const classId = parsed.classId;

    const attendanceRepo = new AttendanceRepository();
    const upserts = parsed.entries.map((entry: any) => ({
      student_id: entry.studentId,
      status: entry.status,
      notes: entry.notes,
      date,
      class_id: classId || null,
      marked_by_teacher_id: user.role === 'teacher' ? user.id : null,
      marked_by_user_id: user.role === 'admin' ? user.id : null,
    }));

    // upsert per student+date to avoid duplicates
    // Supabase allows bulk upsert if we specify the onConflict constraint
    const { data: results, error } = await attendanceRepo.getClient()
        .from('attendance')
        .upsert(upserts, { onConflict: 'student_id, date' })
        .select();

    if (error) throw error;

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[POST /api/teachers/attendance/mark]", err);
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
