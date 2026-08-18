import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { TimetableCreateZ } from "@/lib/validations/timetableSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TimetableRepository } from "@/repositories/timetable.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Admin + Teacher can fetch all
  if (!["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  
  const repo = new TimetableRepository();
  let query = repo.getClient().from('timetable')
    .select('*, classId:classes(id, name, section), teacherId:teachers(id, name)');
    
  if (teacherId) {
      query = query.eq('teacher_id', teacherId);
  }

  const { data: rawTimetable, error } = await query;
  if (error) {
      console.error("[GET /api/timetable] Error fetching timetable:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 });
  }

  const timetable = (rawTimetable || []).map((t: any) => ({
      _id: t.id,
      id: t.id,
      classId: t.classId ? { _id: t.classId.id, name: t.classId.name, section: t.classId.section } : null,
      teacherId: t.teacherId ? { _id: t.teacherId.id, name: t.teacherId.name } : null,
      subject: t.subject,
      day: t.day,
      startTime: t.start_time,
      endTime: t.end_time,
      roomNumber: t.room_number,
      createdAt: t.created_at,
      updatedAt: t.updated_at
  }));

  const today = new Date().toISOString().split('T')[0];

  // Fetch active leaves and substitutes to show in the timetable UI
  const { data: activeLeaves } = await repo.getClient().from('teacher_leaves')
    .select('*')
    .eq('status', 'approved')
    .gte('end_date', today);

  const leaves = (activeLeaves || []).map((l: any) => ({
      _id: l.id,
      id: l.id,
      teacherId: l.teacher_id,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      reason: l.reason,
      status: l.status
  }));

  const { data: activeSubstitutes } = await repo.getClient().from('substitute_assignments')
    .select('*, substituteTeacherId:teachers!substitute_assignments_substitute_teacher_id_fkey(id, name)')
    .eq('status', 'assigned')
    .gte('date', today);
    
  const substitutes = (activeSubstitutes || []).map((s: any) => ({
      _id: s.id,
      id: s.id,
      leaveId: s.leave_id,
      originalTeacherId: s.original_teacher_id,
      substituteTeacherId: s.substituteTeacherId ? { _id: s.substituteTeacherId.id, name: s.substituteTeacherId.name } : null,
      classId: s.class_id,
      subject: s.subject,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status
  }));

  return NextResponse.json({ success: true, timetable, activeLeaves: leaves, activeSubstitutes: substitutes });
}

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = TimetableCreateZ.parse(body);

    // Verify teacher exists
    const teacherRepo = new TeacherRepository();
    const teacher = await teacherRepo.findById(parsed.teacherId);
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    const repo = new TimetableRepository();
    
    // Check for overlap
    const { data: overlaps } = await repo.getClient().from('timetable')
        .select('*')
        .eq('teacher_id', parsed.teacherId)
        .eq('day', parsed.day)
        .lt('start_time', parsed.endTime)
        .gt('end_time', parsed.startTime);

    const overlap = overlaps && overlaps.length > 0 ? overlaps[0] : null;

    if (overlap) {
      if (user.role === "admin") {
        await repo.getClient().from('notifications').insert({
          recipient_id: user.id, 
          type: "system",
          title: "Schedule Conflict Prevented",
          message: `Attempted to double-book ${teacher.name} on ${parsed.day} at ${parsed.startTime}-${parsed.endTime}, but they are already booked for ${overlap.subject}.`,
          priority: "high",
          icon: "Calendar"
        });
      }
      return NextResponse.json({ success: false, error: "Teacher is already scheduled for another class during this time." }, { status: 400 });
    }

    const createdRaw = await repo.create({
        class_id: parsed.classId,
        teacher_id: parsed.teacherId,
        subject: parsed.subject,
        day: parsed.day,
        start_time: parsed.startTime,
        end_time: parsed.endTime,
        room_number: parsed.roomNumber
    });
    
    // Auto-update teacher profile with the new subject if not present
    const currentSubjects = (teacher.subjects || []) as string[];
    if (!currentSubjects.includes(parsed.subject)) {
      await teacherRepo.update(teacher.id as string, {
        subjects: [...currentSubjects, parsed.subject],
      });
    }

    // Sync class assignment to teacher_class_assignments table
    const { data: existingAssignment } = await repo.getClient().from('teacher_class_assignments')
        .select('*')
        .eq('teacher_id', parsed.teacherId)
        .eq('class_id', parsed.classId)
        .maybeSingle();

    if (!existingAssignment) {
        await repo.getClient().from('teacher_class_assignments').insert({
            teacher_id: parsed.teacherId,
            class_id: parsed.classId
        });
    }
    
    const created = {
        _id: createdRaw.id,
        id: createdRaw.id,
        classId: createdRaw.class_id,
        teacherId: createdRaw.teacher_id,
        subject: createdRaw.subject,
        day: createdRaw.day,
        startTime: createdRaw.start_time,
        endTime: createdRaw.end_time,
        roomNumber: createdRaw.room_number
    };

    // Log activity only for admin
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "create:timetable",
        message: `Timetable created: ${parsed.subject} on ${parsed.day}`,
        metadata: {
          timetableId: created.id,
          classId: parsed.classId,
          teacherId: parsed.teacherId,
          subject: parsed.subject,
        },
      });
    }

    return NextResponse.json({ success: true, timetable: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
