// app/api/admission/[id]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AdmissionRepository } from "@/repositories/admission.repository";

// ====================== GET ======================
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const repo = new AdmissionRepository();
  const { data: rawAdmissions, error } = await repo.getClient().from('admissions')
      .select('*, parents:admission_parents(*), documents:admission_documents(*)')
      .eq('id', id);

  if (error || !rawAdmissions || rawAdmissions.length === 0)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    
  const rawAdmission = rawAdmissions[0];
  
  const admission = {
      _id: rawAdmission.id,
      id: rawAdmission.id,
      childFirstName: rawAdmission.child_first_name,
      childLastName: rawAdmission.child_last_name,
      dob: rawAdmission.dob,
      gender: rawAdmission.gender,
      preferredClass: rawAdmission.preferred_class,
      previousSchool: rawAdmission.previous_school,
      status: rawAdmission.status,
      appliedByParentId: rawAdmission.applied_by_parent_id,
      admissionFeePaid: rawAdmission.admission_fee_paid,
      adminNote: rawAdmission.admin_note,
      convertedStudentId: rawAdmission.converted_student_id,
      parents: rawAdmission.parents ? rawAdmission.parents.map((p: any) => ({
          _id: p.id,
          id: p.id,
          parentId: p.parent_id,
          name: p.name,
          phone: p.phone,
          email: p.email,
          relation: p.relation
      })) : [],
      documents: rawAdmission.documents ? rawAdmission.documents.map((d: any) => ({
          _id: d.id,
          id: d.id,
          name: d.name,
          url: d.url,
          verified: d.verified
      })) : [],
      createdAt: rawAdmission.created_at,
      updatedAt: rawAdmission.updated_at
  };

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (user?.role === "admin") {
    return NextResponse.json({ success: true, admission });
  }

  if (user?.role === "parent") {
    const allowed =
      String(admission.appliedByParentId) === String(user.id) ||
      (admission.parents || []).some(
        (p: any) => String(p.parentId) === String(user.id)
      );

    if (!allowed)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ success: true, admission });
  }

  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
}



// ====================== PUT ======================
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  const repo = new AdmissionRepository();
  const existingAdmissionRaw = await repo.findById(id);

  if (!existingAdmissionRaw)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Parent can modify only if they applied
  if (user?.role === "parent") {
    if (String(existingAdmissionRaw.applied_by_parent_id) !== String(user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!["submitted", "pending"].includes(existingAdmissionRaw.status)) {
      return NextResponse.json({ success: false, error: "Cannot modify" }, { status: 400 });
    }
  } 
  // Non-admins blocked
  else if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    const updatePayload: any = { ...body };
    delete updatePayload._id;
    if (updatePayload.childFirstName !== undefined) updatePayload.child_first_name = updatePayload.childFirstName;
    if (updatePayload.childLastName !== undefined) updatePayload.child_last_name = updatePayload.childLastName;
    if (updatePayload.dob !== undefined) updatePayload.dob = updatePayload.dob ? new Date(updatePayload.dob).toISOString().split('T')[0] : null;
    if (updatePayload.preferredClass !== undefined) updatePayload.preferred_class = updatePayload.preferredClass;
    if (updatePayload.previousSchool !== undefined) updatePayload.previous_school = updatePayload.previousSchool;
    if (updatePayload.appliedByParentId !== undefined) updatePayload.applied_by_parent_id = updatePayload.appliedByParentId;
    if (updatePayload.admissionFeePaid !== undefined) updatePayload.admission_fee_paid = updatePayload.admissionFeePaid;
    if (updatePayload.adminNote !== undefined) updatePayload.admin_note = updatePayload.adminNote;
    if (updatePayload.convertedStudentId !== undefined) updatePayload.converted_student_id = updatePayload.convertedStudentId;
    delete updatePayload.childFirstName;
    delete updatePayload.childLastName;
    delete updatePayload.preferredClass;
    delete updatePayload.previousSchool;
    delete updatePayload.appliedByParentId;
    delete updatePayload.admissionFeePaid;
    delete updatePayload.adminNote;
    delete updatePayload.convertedStudentId;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;
    delete updatePayload.parents;
    delete updatePayload.documents;

    const updatedRaw = await repo.update(id, updatePayload);
    
    // We can also fetch the updated object if needed, but for now we just return success
    return NextResponse.json({ success: true, admission: updatedRaw });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Update failed" },
      { status: 400 }
    );
  }
}



// ====================== DELETE ======================
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Only admin may delete" },
      { status: 403 }
    );
  }

  const repo = new AdmissionRepository();
  const deleted = await repo.delete(id);

  if (!deleted)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, deletedId: id });
}
