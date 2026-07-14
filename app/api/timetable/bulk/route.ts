import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TimetableRepository } from "@/repositories/timetable.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";

export async function POST(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const savedEntries = [];
    const conflicts = [];
    
    const repo = new TimetableRepository();
    const teacherRepo = new TeacherRepository();

    for (const entry of entries) {
        const teacher = await teacherRepo.findById(entry.teacherId);
        if (!teacher) {
            conflicts.push(`Teacher not found for ${entry.subject} on ${entry.day}`);
            continue;
        }

        // Check for overlap
        const { data: overlaps } = await repo.getClient().from('timetable')
            .select('*')
            .eq('teacher_id', entry.teacherId)
            .eq('day', entry.day)
            .lt('start_time', entry.endTime)
            .gt('end_time', entry.startTime);
            
        const overlap = overlaps && overlaps.length > 0 ? overlaps[0] : null;

        if (overlap) {
            conflicts.push(`Double-book prevented: ${teacher.name} is already booked for ${overlap.subject} on ${entry.day} at ${overlap.start_time}-${overlap.end_time}.`);
            continue;
        }

        const createdRaw = await repo.create({
            class_id: entry.classId,
            teacher_id: entry.teacherId,
            subject: entry.subject,
            day: entry.day,
            start_time: entry.startTime,
            end_time: entry.endTime,
            room_number: entry.roomNumber
        });
        
        // Auto-update teacher profile with the new subject if not present
        const currentSubjects = (teacher.subjects || []) as string[];
        const currentClasses = (teacher.classes || []) as string[];
        const updates: any = {};
        if (!currentSubjects.includes(entry.subject)) updates.subjects = [...currentSubjects, entry.subject];
        if (!currentClasses.includes(entry.classId)) updates.classes = [...currentClasses, entry.classId];
        
        if (Object.keys(updates).length > 0) {
            await teacherRepo.update(teacher.id as string, updates);
        }
        
        savedEntries.push({
            _id: createdRaw.id,
            id: createdRaw.id,
            classId: createdRaw.class_id,
            teacherId: createdRaw.teacher_id,
            subject: createdRaw.subject,
            day: createdRaw.day,
            startTime: createdRaw.start_time,
            endTime: createdRaw.end_time,
            roomNumber: createdRaw.room_number
        });
    }

    if (conflicts.length > 0 && user.role === "admin") {
        await repo.getClient().from('notifications').insert({
            recipient_id: user.id, 
            type: "system",
            title: "Bulk Schedule Conflicts",
            message: conflicts.join(" \n"),
            priority: "high",
            icon: "Calendar"
        });
    }

    if (savedEntries.length > 0 && user.role === "admin") {
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "create:timetable:bulk",
            message: `Created ${savedEntries.length} timetable entries`,
            metadata: { count: savedEntries.length }
        });
    }

    // Return an error status ONLY if zero entries were saved, otherwise return 201 with conflicts info
    if (savedEntries.length === 0 && conflicts.length > 0) {
        return NextResponse.json({ success: false, error: conflicts.join(" \n") }, { status: 400 });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Created ${savedEntries.length} entries. ${conflicts.length} conflicts skipped.`,
        conflicts,
        count: savedEntries.length
    }, { status: 201 });

  } catch (err: any) {
    console.error("[Timetable Bulk Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
