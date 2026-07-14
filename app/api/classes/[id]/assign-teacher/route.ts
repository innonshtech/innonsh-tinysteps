import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { teacherId } = await req.json();
  const { id } = await context.params;

  const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('id', teacherId).single();
  if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" });

  await supabaseAdmin.from('teacher_class_assignments').upsert({ teacher_id: teacherId, class_id: id }, { onConflict: 'teacher_id, class_id' });

  // Return class
  const { data: classData } = await supabaseAdmin.from('classes').select('*').eq('id', id).single();

  return NextResponse.json({ success: true, class: classData });
}
