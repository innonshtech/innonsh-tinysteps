import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { TimetableCreateZ } from "@/lib/validations/timetableSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TimetableRepository } from "@/repositories/timetable.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";

// ---------------------- PUT ----------------------
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const token = req.cookies.get("token")?.value;
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
            .neq('id', id)
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

        const updatedRaw = await repo.update(id, {
            class_id: parsed.classId,
            teacher_id: parsed.teacherId,
            subject: parsed.subject,
            day: parsed.day,
            start_time: parsed.startTime,
            end_time: parsed.endTime,
            room_number: parsed.roomNumber
        });

        if (!updatedRaw) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }
        
        const updated = {
            _id: updatedRaw.id,
            id: updatedRaw.id,
            classId: updatedRaw.class_id,
            teacherId: updatedRaw.teacher_id,
            subject: updatedRaw.subject,
            day: updatedRaw.day,
            startTime: updatedRaw.start_time,
            endTime: updatedRaw.end_time,
            roomNumber: updatedRaw.room_number
        };

        // Log activity only for admin
        if (user.role === "admin") {
            await logAdminActivity({
                actorId: String(user.id),
                actorRole: user.role,
                action: "update:timetable",
                message: `Timetable updated: ${updated.subject}`,
                metadata: {
                    timetableId: updated.id,
                    classId: updated.classId,
                    teacherId: updated.teacherId,
                    subject: updated.subject,
                }
            });
        }

        return NextResponse.json({ success: true, timetable: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

// ---------------------- DELETE ----------------------
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const repo = new TimetableRepository();
    // we need to get the record first to log it
    const { data: record } = await repo.getClient().from('timetable').select('*').eq('id', id).single();
    if (!record) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await repo.delete(id);

    // Log activity only for admin
    if (user.role === "admin") {
        await logAdminActivity({
            actorId: String(user.id),
            actorRole: user.role,
            action: "delete:timetable",
            message: `Timetable deleted: ${record.subject}`,
            metadata: {
                timetableId: record.id,
                subject: record.subject,
            }
        });
    }

    return NextResponse.json({ success: true, deletedId: id });
}
