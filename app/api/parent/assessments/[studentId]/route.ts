import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { parentOwnsStudent } from "@/lib/parent";
import { AssessmentRepository } from "@/repositories/exam.repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await context.params;   // ✅ FIX THAT REMOVES ERROR

  const token = req.cookies.get("token")?.value;
  const parent = verifyToken(token);

  if (!parent || parent.role !== "parent") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const student = await parentOwnsStudent(studentId, parent.id, (parent as any).email);

  if (!student) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const repo = new AssessmentRepository();
  const assessments = await repo.find({ student_id: studentId }, { sort: { field: 'created_at', ascending: false } });

  const mappedAssessments = assessments.map((a: any) => ({
    ...a,
    _id: a.id,
    studentId: a.student_id,
    classId: a.class_id,
    subjectId: a.subject_id
  }));

  return NextResponse.json({ success: true, assessments: mappedAssessments });
}
