// app/api/admission/list/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AdmissionRepository } from "@/repositories/admission.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);
    if (!user || user.role !== "admin") return NextResponse.json({ success:false, error:"Unauthorized" }, { status:403 });

    const repo = new AdmissionRepository();
    const { data: rawAdmissions, error } = await repo.getClient().from('admissions')
        .select('*, parents:admission_parents(*)')
        .order('created_at', { ascending: false });
        
    if (error) throw error;

    let admissions = rawAdmissions.map((a: any) => ({
      _id: a.id,
      id: a.id,
      admissionNo: a.admission_no,
      childFirstName: a.child_first_name,
      childLastName: a.child_last_name,
      dob: a.dob,
      gender: a.gender,
      preferredClass: a.preferred_class,
      previousSchool: a.previous_school,
      status: a.status,
      appliedByParentId: a.applied_by_parent_id,
      admissionFeePaid: a.admission_fee_paid,
      adminNote: a.admin_note,
      convertedStudentId: a.converted_student_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      parents: a.parents ? a.parents.map((p: any) => ({
          _id: p.id,
          id: p.id,
          parentId: p.parent_id,
          name: p.name,
          phone: p.phone,
          email: p.email,
          relation: p.relation
      })) : []
    }));
    
    // Auto-seed if database is empty
    if (admissions.length === 0) {
      console.log("🌱 Admissions table empty. Auto-seeding sample data...");
      const sampleAdmissions = [
        { child_first_name: "Aarav", child_last_name: "Sharma", preferred_class: "Nursery", status: "pending" },
        { child_first_name: "Anaya", child_last_name: "Patil", preferred_class: "KG1", status: "pending" },
        { child_first_name: "Vivaan", child_last_name: "Mehta", preferred_class: "KG1", status: "pending" },
        { child_first_name: "Diya", child_last_name: "Kulkarni", preferred_class: "KG2", status: "pending" },
        { child_first_name: "Kabir", child_last_name: "Singh", preferred_class: "Nursery", status: "pending" },
      ];
      await repo.getClient().from('admissions').insert(sampleAdmissions);

      const { data: newRawAdmissions } = await repo.getClient().from('admissions')
        .select('*, parents:admission_parents(*)')
        .order('created_at', { ascending: false });
        
      if (newRawAdmissions) {
          admissions = newRawAdmissions.map((a: any) => ({
              _id: a.id,
              id: a.id,
              admissionNo: a.admission_no,
              childFirstName: a.child_first_name,
              childLastName: a.child_last_name,
              dob: a.dob,
              gender: a.gender,
              preferredClass: a.preferred_class,
              previousSchool: a.previous_school,
              status: a.status,
              appliedByParentId: a.applied_by_parent_id,
              admissionFeePaid: a.admission_fee_paid,
              adminNote: a.admin_note,
              convertedStudentId: a.converted_student_id,
              createdAt: a.created_at,
              updatedAt: a.updated_at,
              parents: a.parents ? a.parents.map((p: any) => ({
                  _id: p.id,
                  id: p.id,
                  parentId: p.parent_id,
                  name: p.name,
                  phone: p.phone,
                  email: p.email,
                  relation: p.relation
              })) : []
          }));
      }
    }

    return NextResponse.json({ success: true, admissions });
  } catch (error: any) {
    console.error("Admissions GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
