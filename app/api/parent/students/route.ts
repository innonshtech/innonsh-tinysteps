import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  // Extract token from cookies
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const user = verifyToken(token);

  // Must be logged in
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Must be PARENT
  if (user.role !== "parent") {
    return NextResponse.json({ success: false, error: "Only parents allowed" }, { status: 403 });
  }

  const studentId = (user as any).studentId || user.id;
  const userEmail = (user as any).email;

  let queryBuilder = supabaseAdmin.from('student_parents').select('student_id');
  if (userEmail) {
    queryBuilder = queryBuilder.or(`parent_user_id.eq.${user.id},email.eq.${userEmail}`);
  } else {
    queryBuilder = queryBuilder.eq('parent_user_id', user.id);
  }

  const { data: mappings } = await queryBuilder;
  const mappedStudentIds = mappings?.map(m => m.student_id) || [];
  
  const allStudentIds = [...new Set([studentId, ...mappedStudentIds])];

  const { data: students } = await supabaseAdmin.from('students')
    .select('*, class:classes(name)')
    .in('id', allStudentIds);

  const mappedStudents = (students || []).map(s => ({
    ...s,
    _id: s.id,
    classId: s.class
  }));

  return NextResponse.json({ success: true, students: mappedStudents });
}
