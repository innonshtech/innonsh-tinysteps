// app/api/admission/inquiry/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import { InquiryZ } from "@/lib/validations/admissionSchema";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const parsed = InquiryZ.parse(body);
    const created = await Inquiry.create(parsed);
    return NextResponse.json({ success: true, inquiry: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
