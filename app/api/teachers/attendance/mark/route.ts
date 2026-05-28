import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { AttendanceMarkZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();

  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["teacher", "admin"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = AttendanceMarkZ.parse(body);

    const date = parsed.date ? new Date(parsed.date) : new Date();
    const classId = parsed.classId;

    // upsert per student+date to avoid duplicates
    const results = [];
    for (const entry of parsed.entries) {
      const existing = await Attendance.findOne({ studentId: entry.studentId, date: { $gte: new Date(date.setHours(0,0,0,0)), $lt: new Date(new Date(date).setHours(23,59,59,999)) }});
      if (existing) {
        existing.status = entry.status;
        existing.notes = entry.notes;
        existing.markedBy = user.id;
        existing.classId = classId || existing.classId;
        await existing.save();
        results.push(existing);
      } else {
        const created = await Attendance.create({
          studentId: entry.studentId,
          status: entry.status,
          notes: entry.notes,
          date,
          classId,
          markedBy: user.id,
        });
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid data" }, { status: 400 });
  }
}
