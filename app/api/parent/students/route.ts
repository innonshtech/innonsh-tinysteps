import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getParentStudentIds, mapStudentForClient } from "@/lib/parent";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const user = verifyToken(token);

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "parent") {
    return NextResponse.json({ success: false, error: "Only parents allowed" }, { status: 403 });
  }

  const userEmail = (user as { email?: string }).email;
  const allStudentIds = await getParentStudentIds(user.id, userEmail);

  if (allStudentIds.length === 0) {
    return NextResponse.json({ success: true, students: [] });
  }

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("*, class:classes(id, name, section), student_parents(*)")
    .in("id", allStudentIds);

  const mappedStudents = (students || []).map((s) => mapStudentForClient(s, s.student_parents));

  return NextResponse.json({ success: true, students: mappedStudents });
}
