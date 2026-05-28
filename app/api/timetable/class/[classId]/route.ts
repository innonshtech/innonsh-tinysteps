import { NextResponse } from "next/server";
import Timetable from "@/models/Timetable";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: any) {
  await connectDB();

  const { classId } = params;

  const result = await Timetable.find({ classId })
    .populate("teacherId")
    .lean();

  return NextResponse.json({ success: true, timetable: result });
}
