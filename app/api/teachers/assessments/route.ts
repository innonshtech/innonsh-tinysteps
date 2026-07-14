import { NextResponse } from "next/server";
import { AssessmentCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import { AssessmentRepository } from "@/repositories/exam.repository";

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

    const assessmentRepo = new AssessmentRepository();
    const created = await assessmentRepo.create({
      student_id: parsed.studentId,
      class_id: parsed.classId,
      term: parsed.term,
      month: parsed.month,
      type: parsed.type,
      subject: parsed.subject,
      score: parsed.score,
      remarks: parsed.remarks,
      teacher_id: user.id,
      date: parsed.date || new Date().toISOString()
    });

    const assessment = {
        _id: created.id,
        id: created.id,
        studentId: created.student_id,
        classId: created.class_id,
        term: created.term,
        month: created.month,
        type: created.type,
        subject: created.subject,
        score: created.score,
        remarks: created.remarks,
        teacherId: created.teacher_id,
        date: created.date,
        createdAt: created.created_at,
        updatedAt: created.updated_at
    };

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}
