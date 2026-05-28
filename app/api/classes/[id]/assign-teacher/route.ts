import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ClassModel from "@/models/Class";
import Teacher from "@/models/Teacher";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request, { params }: any) {
  await connectDB();

  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { teacherId } = await req.json();

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return NextResponse.json({ success: false, error: "Teacher not found" });
    console.log(params.id, teacherId);
  const updated = await ClassModel.findByIdAndUpdate(
    params.id,
    { $addToSet: { teachers: teacherId } },
    { new: true }
  );

  return NextResponse.json({ success: true, class: updated });
}
