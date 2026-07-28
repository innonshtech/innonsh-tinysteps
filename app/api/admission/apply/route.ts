// app/api/admission/apply/route.ts
import { NextResponse } from "next/server";
import { AdmissionApplyZ } from "@/lib/validations/admissionSchema";
import { verifyToken } from "@/lib/auth";
import { AdmissionRepository } from "@/repositories/admission.repository";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  // parent must be logged in (or admin can create on behalf)
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  try {
    const body = await req.json();
    const parsed = AdmissionApplyZ.parse(body);

    // Fetch active academic year from school_settings as source of truth
    let activeAcademicYear = parsed.academicYear || null;
    try {
      const { data: settings } = await supabaseAdmin.from('school_settings').select('academic_year').limit(1).maybeSingle();
      if (settings?.academic_year) {
        activeAcademicYear = settings.academic_year;
      }
    } catch (e) {
      console.warn("Could not fetch school_settings academic_year, falling back safely:", e);
    }

    const repo = new AdmissionRepository();
    const createdRaw = await repo.create({
        child_first_name: parsed.childFirstName,
        child_last_name: parsed.childLastName,
        dob: parsed.dob ? new Date(parsed.dob).toISOString().split('T')[0] : null,
        gender: parsed.gender,
        preferred_class: parsed.preferredClass,
        previous_school: parsed.previousSchool,
        status: "submitted",
        applied_by_parent_id: user?.role === "parent" ? user.id : null,
        admission_fee_paid: false
    });

    if (parsed.parents && Array.isArray(parsed.parents) && parsed.parents.length > 0) {
        const parentInserts = parsed.parents.map((p: any) => ({
            admission_id: createdRaw.id,
            parent_id: p.parentId || null,
            name: p.name,
            phone: p.phone,
            email: p.email,
            relation: p.relation
        }));
        await repo.getClient().from('admission_parents').insert(parentInserts);
    }

    if (parsed.documents && Array.isArray(parsed.documents) && parsed.documents.length > 0) {
        const docInserts = parsed.documents.map((d: any) => ({
            admission_id: createdRaw.id,
            name: d.name,
            url: d.url,
            verified: false
        }));
        await repo.getClient().from('admission_documents').insert(docInserts);
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
      appliedByParentId: createdRaw.applied_by_parent_id,
      admissionFeePaid: createdRaw.admission_fee_paid,
      parents: parsed.parents || [],
      documents: parsed.documents || [],
      createdAt: createdRaw.created_at,
      updatedAt: createdRaw.updated_at
    };

    return NextResponse.json({ success: true, admission: created }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admission/apply]", err);
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
