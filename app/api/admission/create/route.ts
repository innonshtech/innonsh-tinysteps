// app/api/admission/create/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AdmissionRepository } from "@/repositories/admission.repository";
import { supabaseAdmin } from "@/lib/supabase";
import { validateParentLoginEmail, normalizeEmail } from "@/lib/validations/emailValidation";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const {
      childFirstName,
      childLastName,
      dob,
      gender,
      preferredClass,
      academicYear,
      previousSchool,
      previousClass,
      reasonForLeaving,
      bloodGroup,
      allergies,
      medicalNotes,
      photoUrl,
      address,
      city,
      state,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      parents,
      documents,
      applicationDate,
      adminNote,
    } = body;

    if (!childFirstName || !childFirstName.trim()) {
      return NextResponse.json({ success: false, error: "Child First Name is required." }, { status: 400 });
    }

    if (!dob) {
      return NextResponse.json({ success: false, error: "Date of birth is required." }, { status: 400 });
    }

    if (!gender) {
      return NextResponse.json({ success: false, error: "Gender is required." }, { status: 400 });
    }

    if (!preferredClass) {
      return NextResponse.json({ success: false, error: "Applied Class is required." }, { status: 400 });
    }

    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return NextResponse.json({ success: false, error: "At least one parent/guardian is required." }, { status: 400 });
    }

    const primaryParent = parents[0];
    if (!primaryParent.name || !primaryParent.name.trim()) {
      return NextResponse.json({ success: false, error: "Parent Name is required." }, { status: 400 });
    }

    if (!primaryParent.phone || !/^\d{10}$/.test(primaryParent.phone.trim())) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit phone number." }, { status: 400 });
    }

    const cleanEmail = normalizeEmail(primaryParent.email || "");
    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: "Parent Email is required." }, { status: 400 });
    }

    const emailCheck = validateParentLoginEmail(cleanEmail);
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error || "Enter a valid email address." }, { status: 400 });
    }

    // Fetch active academic year if not provided
    let activeAcademicYear = academicYear || null;
    if (!activeAcademicYear) {
      try {
        const { data: settings } = await supabaseAdmin.from("school_settings").select("academic_year").limit(1).maybeSingle();
        if (settings?.academic_year) {
          activeAcademicYear = settings.academic_year;
        }
      } catch (e) {
        console.warn("Could not fetch school_settings academic_year:", e);
      }
    }

    // Construct metadata summary for extra fields (address, emergency contact, medical, etc.)
    const extraDetails = {
      source: "ADMIN_WALKIN",
      photoUrl: photoUrl || null,
      residentialAddress: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      bloodGroup: bloodGroup || null,
      allergies: allergies || null,
      medicalNotes: medicalNotes || null,
      previousClass: previousClass || null,
      reasonForLeaving: reasonForLeaving || null,
      applicationDate: applicationDate || new Date().toISOString().split("T")[0],
    };

    const combinedNote = adminNote
      ? `${adminNote}\n\n[Details: ${JSON.stringify(extraDetails)}]`
      : `[Source: Walk-in / Admin] [Details: ${JSON.stringify(extraDetails)}]`;

    const repo = new AdmissionRepository();
    const createdRaw = await repo.create({
      child_first_name: childFirstName.trim(),
      child_last_name: childLastName ? childLastName.trim() : null,
      dob: new Date(dob).toISOString().split("T")[0],
      gender,
      preferred_class: preferredClass,
      previous_school: previousSchool ? previousSchool.trim() : null,
      status: "pending",
      applied_by_parent_id: null,
      admission_fee_paid: false,
      admin_note: combinedNote,
    });

    // Insert parents into admission_parents table
    if (parents && Array.isArray(parents) && parents.length > 0) {
      const parentInserts = parents.map((p: any) => ({
        admission_id: createdRaw.id,
        parent_id: null,
        name: p.name.trim(),
        phone: p.phone ? p.phone.trim() : "",
        email: p.email ? p.email.trim() : "",
        relation: p.relation || "Father",
      }));
      await repo.getClient().from("admission_parents").insert(parentInserts);
    }

    // Insert documents into admission_documents table
    if (documents && Array.isArray(documents) && documents.length > 0) {
      const docInserts = documents
        .filter((d: any) => d.url && d.name)
        .map((d: any) => ({
          admission_id: createdRaw.id,
          name: d.name,
          url: d.url,
          verified: false,
        }));
      if (docInserts.length > 0) {
        await repo.getClient().from("admission_documents").insert(docInserts);
      }
    }

    const created = {
      _id: createdRaw.id,
      id: createdRaw.id,
      childFirstName: createdRaw.child_first_name,
      childLastName: createdRaw.child_last_name,
      dob: createdRaw.dob,
      gender: createdRaw.gender,
      preferredClass: createdRaw.preferred_class,
      academicYear: createdRaw.academic_year,
      previousSchool: createdRaw.previous_school,
      status: createdRaw.status,
      appliedByParentId: null,
      admissionFeePaid: false,
      adminNote: createdRaw.admin_note,
      parents: parents,
      documents: documents || [],
      createdAt: createdRaw.created_at,
      updatedAt: createdRaw.updated_at,
    };

    return NextResponse.json({ success: true, admission: created }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admission/create]", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create admission" }, { status: 500 });
  }
}
