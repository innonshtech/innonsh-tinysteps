// app/api/admission/inquiry/list/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const { data: inquiries } = await supabaseAdmin.from('inquiries').select('*').order('created_at', { ascending: false });
  const mappedInquiries = (inquiries || []).map((i: any) => ({
    ...i,
    _id: i.id,
    parentName: i.parent_name,
    parentEmail: i.parent_email,
    parentPhone: i.parent_phone,
    childName: i.child_name,
    childDob: i.child_dob,
    preferredClass: i.preferred_class,
    createdAt: i.created_at
  }));
  return NextResponse.json({ success: true, inquiries: mappedInquiries });
}
