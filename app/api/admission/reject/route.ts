// app/api/admission/reject/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admission from "@/models/Admission";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const { admissionId, reason } = await req.json();
  const admission = await Admission.findById(admissionId);
  if (!admission) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });

  admission.status = "rejected";
  admission.adminNote = reason || "Rejected by admin";
  await admission.save();

  return NextResponse.json({ success:true, admission });
}
