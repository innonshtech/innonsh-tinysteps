import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request, { params }: any) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { studentId } = await req.json();

  const student = await Student.findById(studentId);
  if (!student) return NextResponse.json({ success: false, error: "Student not found" });

  const updated = await ClassModel.findByIdAndUpdate(
    params.id,
    { $addToSet: { students: studentId } },
    { new: true }
  );

  return NextResponse.json({ success: true, class: updated });
}
