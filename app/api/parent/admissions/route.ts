// app/api/parent/admissions/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "parent") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const { data: mappings } = await supabaseAdmin.from('admission_parents').select('admission_id').eq('parent_user_id', user.id);
  const mappedIds = mappings?.map(m => m.admission_id) || [];

  let query = supabaseAdmin.from('admissions').select('*').order('created_at', { ascending: false });
  
  if (mappedIds.length > 0) {
    query = query.or(`applied_by_parent_id.eq.${user.id},id.in.(${mappedIds.join(',')})`);
  } else {
    query = query.eq('applied_by_parent_id', user.id);
  }

  const { data: admissions } = await query;

  const mappedAdmissions = (admissions || []).map(a => ({
    ...a,
    _id: a.id,
    academicYear: a.academic_year,
    appliedByParentId: a.applied_by_parent_id,
    createdAt: a.created_at
  }));

  return NextResponse.json({ success: true, admissions: mappedAdmissions });
}
