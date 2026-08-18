import { NextResponse } from "next/server";
import { AssessmentCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import { AssessmentRepository } from "@/repositories/exam.repository";
import { StudentRepository } from "@/repositories/student.repository";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["teacher", "admin"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = AssessmentCreateZ.parse(body);

    const studentRepo = new StudentRepository();
    const student = await studentRepo.findById(parsed.studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const assessmentRepo = new AssessmentRepository();
    const created = await assessmentRepo.create({
      student_id: parsed.studentId,
      class_id: student.class_id,
      term: parsed.term,
      cognitive: parsed.cognitive,
      motor: parsed.motor,
      social: parsed.social,
      notes: parsed.notes,
      score: parsed.score,
      teacher_id: user.id
    });

    const assessment = {
        _id: created.id,
        id: created.id,
        studentId: created.student_id,
        classId: created.class_id,
        term: created.term,
        cognitive: created.cognitive,
        motor: created.motor,
        social: created.social,
        notes: created.notes,
        score: created.score,
        teacherId: created.teacher_id,
        createdAt: created.created_at,
        updatedAt: created.updated_at
    };

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}
