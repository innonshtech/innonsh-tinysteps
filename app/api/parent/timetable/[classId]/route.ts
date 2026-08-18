import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { TimetableRepository } from "@/repositories/timetable.repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ classId: string }> }
) {
  const { classId } = await context.params;   // ✅ FIX — MUST await params

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  // Verify the parent actually manages a child assigned to this class
  const studentId = (parent as any).studentId || parent.id;
  const parentEmail = (parent as any).email;

  let queryBuilder = supabaseAdmin.from('student_parents').select('student_id');
  if (parentEmail) {
    queryBuilder = queryBuilder.or(`parent_user_id.eq.${parent.id},email.eq.${parentEmail}`);
  } else {
    queryBuilder = queryBuilder.eq('parent_user_id', parent.id);
  }

  const { data: mappings } = await queryBuilder;
  const mappedStudentIds = mappings?.map((m: any) => m.student_id) || [];
  
  const allStudentIds = [...new Set([studentId, ...mappedStudentIds])];

  const { data: students } = await supabaseAdmin.from('students')
    .select('id')
    .eq('class_id', classId)
    .in('id', allStudentIds);

  if (!students || students.length === 0) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const repo = new TimetableRepository();
  const timetable = await repo.find({ class_id: classId });

  const mappedTimetable = timetable.map(t => ({
    ...t,
    _id: t.id,
    classId: t.class_id,
    teacherId: t.teacher, // Repositories join teacher automatically if implemented or we can just send teacher object
  }));

  return NextResponse.json({ success: true, timetable: mappedTimetable });
}
