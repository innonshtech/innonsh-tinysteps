import { NextResponse, NextRequest } from "next/server";
import { TimetableRepository } from "@/repositories/timetable.repository";

export async function GET(req: NextRequest, context: { params: Promise<{ classId: string }> }) {
  const { classId } = await context.params;

  const repo = new TimetableRepository();
  const { data: rawTimetable } = await repo.getClient().from('timetable')
    .select('*, teacherId:teachers(id, name)')
    .eq('class_id', classId);

  const timetable = (rawTimetable || []).map((t: any) => ({
      _id: t.id,
      id: t.id,
      classId: t.class_id,
      teacherId: t.teacherId ? { _id: t.teacherId.id, name: t.teacherId.name } : null,
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
