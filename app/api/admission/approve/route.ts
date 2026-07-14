// app/api/admission/approve/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { generateAdmissionNo } from "@/lib/admissionNumber";
import { AdmissionRepository } from "@/repositories/admission.repository";
import { StudentRepository } from "@/repositories/student.repository";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const { admissionId, classId, assignSection } = await req.json();

    const admissionRepo = new AdmissionRepository();
    const { data: rawAdmissions, error } = await admissionRepo.getClient().from('admissions')
        .select('*, parents:admission_parents(*), documents:admission_documents(*)')
        .eq('id', admissionId);

    if (error || !rawAdmissions || rawAdmissions.length === 0)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      
    const admission = rawAdmissions[0];

    // Generate admission number
    let admNo = admission.admission_no;
    if (!admNo) {
      admNo = await generateAdmissionNo();
    }

    const studentRepo = new StudentRepository();
    const studentRaw = await studentRepo.create({
      first_name: admission.child_first_name,
      last_name: admission.child_last_name,
      dob: admission.dob,
      gender: admission.gender,
      class_id: classId,
      // section: assignSection, // In Postgres, section is probably on classes table, but if students has section we'd map it. Wait, students table does not have 'section', it relies on class_id.
      admission_no: admNo,
      admission_date: new Date().toISOString().split('T')[0]
    });
    
    // In Postgres schema, 'students' does not have 'section' column, it relies on classes table.
    // So class_id is sufficient.

    if (admission.parents && admission.parents.length > 0) {
        const parentInserts = admission.parents.map((p: any) => ({
            student_id: studentRaw.id,
            parent_id: p.parent_id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            relation: p.relation
        }));
        await studentRepo.getClient().from('student_parents').insert(parentInserts);
    }
    
    if (admission.documents && admission.documents.length > 0) {
        const docInserts = admission.documents.map((d: any) => ({
            student_id: studentRaw.id,
            name: d.name,
            url: d.url,
            verified: d.verified
        }));
        await studentRepo.getClient().from('student_documents').insert(docInserts);
    }

    // Update admission record
    await admissionRepo.update(admissionId, {
        status: "approved",
        converted_student_id: studentRaw.id,
        admission_no: admNo
    });

    return NextResponse.json({ success: true, admission: { ...admission, status: "approved", converted_student_id: studentRaw.id }, student: studentRaw });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message || "Approve failed" },
      { status: 500 }
    );
  }
}
