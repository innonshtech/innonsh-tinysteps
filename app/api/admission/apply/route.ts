// app/api/admission/apply/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admission from "@/models/Admission";
import { AdmissionApplyZ } from "@/lib/validations/admissionSchema";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();

  // parent must be logged in (or admin can create on behalf)
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  try {
    const body = await req.json();
    const parsed = AdmissionApplyZ.parse(body);

    const payload: any = {
      ...parsed,
      dob: parsed.dob ? new Date(parsed.dob) : undefined,
      status: "submitted",
    };

    if (user?.role === "parent") payload.appliedByParentId = user.id;

    const created = await Admission.create(payload);
    return NextResponse.json({ success: true, admission: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
