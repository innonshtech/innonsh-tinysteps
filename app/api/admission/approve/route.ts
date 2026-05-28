// app/api/admission/approve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admission from "@/models/Admission";
import Student from "@/models/Student";
import ClassModel from "@/models/Class";   // <-- ADD THIS
import { verifyToken } from "@/lib/auth";
import { generateAdmissionNo } from "@/lib/admissionNumber";

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const { admissionId, classId, assignSection } = await req.json();

    const admission = await Admission.findById(admissionId);
    if (!admission)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Generate admission number
    if (!admission.admissionNo) {
      admission.admissionNo = await generateAdmissionNo();
    }

    // Prepare parent structure
    const parentsForStudent = (admission.parents || []).map((p: any) => ({
      parentId: p.parentId || null,
      name: p.name,
      phone: p.phone,
      email: p.email,
      relation: p.relation,
    }));

    // Create Student record
    const student = await Student.create({
      firstName: admission.childFirstName,
      lastName: admission.childLastName,
      dob: admission.dob,
      gender: admission.gender,
      classId: classId,
      section: assignSection,
      admissionNo: admission.admissionNo,
      admissionDate: new Date(),
      parents: parentsForStudent,
      documents: admission.documents || [],
    });

    // 🔥 ***IMPORTANT: Add newly created student into Class.students[]***
    if (classId) {
      await ClassModel.findByIdAndUpdate(classId, {
        $addToSet: { students: student._id } // ← prevents duplicates
      });
    }

    // Update admission record
    admission.status = "approved";
    admission.convertedStudentId = student._id;
    await admission.save();

    return NextResponse.json({ success: true, admission, student });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message || "Approve failed" },
      { status: 500 }
    );
  }
}
