import { NextResponse } from "next/server";
import Timetable from "@/models/Timetable";
import { connectDB } from "@/lib/db";

export async function GET(req: Request, { params }: any) {
  await connectDB();

  const result = await Timetable.find({ teacherId: params.teacherId })
    .populate("classId")
    .lean();

  return NextResponse.json({ success: true, timetable: result });
}
