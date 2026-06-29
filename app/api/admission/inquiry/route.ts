// app/api/admission/inquiry/route.ts
import { NextResponse } from "next/server";
import { InquiryZ } from "@/lib/validations/admissionSchema";
import { InquiryRepository } from "@/repositories/inquiry.repository";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = InquiryZ.parse(body);
    
    const repo = new InquiryRepository();
    const createdRaw = await repo.create({
      parent_name: parsed.parentName,
      parent_email: parsed.parentEmail,
      parent_phone: parsed.parentPhone,
      child_name: parsed.childName,
      child_dob: parsed.childDob ? new Date(parsed.childDob).toISOString().split('T')[0] : null,
      preferred_class: parsed.preferredClass,
      message: parsed.message,
      source: parsed.source,
      status: 'new'
    });

    const created = {
      _id: createdRaw.id,
      id: createdRaw.id,
      parentName: createdRaw.parent_name,
      parentEmail: createdRaw.parent_email,
      parentPhone: createdRaw.parent_phone,
      childName: createdRaw.child_name,
      childDob: createdRaw.child_dob,
      preferredClass: createdRaw.preferred_class,
      message: createdRaw.message,
      source: createdRaw.source,
      status: createdRaw.status,
      createdAt: createdRaw.created_at,
      updatedAt: createdRaw.updated_at
    };

    return NextResponse.json({ success: true, inquiry: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
