import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { studentId } = await req.json();
  const { id } = await context.params;

  const { data: student } = await supabaseAdmin.from('students').select('id').eq('id', studentId).single();
  if (!student) return NextResponse.json({ success: false, error: "Student not found" });

  const { data: updated, error } = await supabaseAdmin.from('students')
    .update({ class_id: id })
    .eq('id', studentId)
    .select('class_id')
    .single();

  if (error) {
     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // To match previous behavior, we would return the class object
  const { data: classData } = await supabaseAdmin.from('classes').select('*').eq('id', id).single();

  return NextResponse.json({ success: true, class: classData });
}
