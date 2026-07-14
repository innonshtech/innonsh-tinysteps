import { NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { date, classId, records, markedBy } = body;

        if (!date || !classId || !Array.isArray(records)) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: date, classId, records[]" },
                { status: 400 }
            );
        }

        const [year, month, day] = date.split('-').map(Number);

        // Supabase date strings
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();

        const attendanceRepo = new AttendanceRepository();

        const operations = records.map(async (record: any) => {
            const { studentId, status, notes } = record;

            const { data: existingData } = await attendanceRepo.findWithRelations({
                student_id: studentId,
                startDate: startOfDay,
                endDate: endOfDay
            });

            const existing = existingData.length > 0 ? existingData[0] : null;

            if (existing) {
                // Update
                const updateData: any = { status };
                if (notes !== undefined) updateData.notes = notes;
                if (markedBy) updateData.marked_by_teacher_id = markedBy;
                return attendanceRepo.update(existing.id, updateData);
            } else {
                // Create
                return attendanceRepo.create({
                    student_id: studentId,
                    class_id: classId,
                    date: new Date(date),
                    status,
                    notes,
                    marked_by_teacher_id: markedBy,
                });
            }
        });

        await Promise.all(operations);

        return NextResponse.json({ success: true, message: "Attendance marked successfully" });

    } catch (error: any) {
        console.error("[POST /api/attendance/bulk]", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to mark attendance" },
            { status: 500 }
        );
    }
}

