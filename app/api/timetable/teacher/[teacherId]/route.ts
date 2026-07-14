import { NextResponse, NextRequest } from "next/server";
import { TimetableRepository } from "@/repositories/timetable.repository";

export async function GET(req: NextRequest, context: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await context.params;

  const repo = new TimetableRepository();
  const { data: rawTimetable } = await repo.getClient().from('timetable')
    .select('*, classId:classes(id, name, section)')
    .eq('teacher_id', teacherId);

  const timetable = (rawTimetable || []).map((t: any) => ({
      _id: t.id,
      id: t.id,
      classId: t.classId ? { _id: t.classId.id, name: t.classId.name, section: t.classId.section } : null,
      teacherId: t.teacher_id,
      subject: t.subject,
      day: t.day,
      startTime: t.start_time,
      endTime: t.end_time,
      roomNumber: t.room_number,
      createdAt: t.created_at,
      updatedAt: t.updated_at
  }));

  return NextResponse.json({ success: true, timetable });
}
