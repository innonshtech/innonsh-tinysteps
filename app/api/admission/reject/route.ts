// app/api/admission/reject/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AdmissionRepository } from "@/repositories/admission.repository";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

  const { admissionId, reason } = await req.json();
  const repo = new AdmissionRepository();
  const admission = await repo.findById(admissionId);
  if (!admission) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });

  const updatedRaw = await repo.update(admissionId, {
      status: "rejected",
      admin_note: reason || "Rejected by admin"
  });

  return NextResponse.json({ success:true, admission: updatedRaw });
}
