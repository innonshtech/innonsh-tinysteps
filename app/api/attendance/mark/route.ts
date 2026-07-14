import { NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";

// POST - Mark attendance for one or multiple students
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { records, classId, date, markedBy } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "records array is required with at least one entry" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: "date is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["present", "absent", "late", "excused"];
    const attendanceRecords = [];
    const errors = [];

    const attendanceRepo = new AttendanceRepository();
    const targetDate = new Date(date).toISOString();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { studentId, status, notes } = record;

      if (!studentId) {
        errors.push({ index: i, error: "studentId is required" });
        continue;
      }

      if (!status || !validStatuses.includes(status)) {
        errors.push({
          index: i,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
        continue;
      }

      try {
        const { data: existingData } = await attendanceRepo.findWithRelations({
          student_id: studentId,
          date: targetDate,
        });
        
        const existingAttendance = existingData.length > 0 ? existingData[0] : null;

        if (existingAttendance) {
          const updated = await attendanceRepo.update(existingAttendance.id, {
            status,
            notes: notes || existingAttendance.notes,
            marked_by_teacher_id: markedBy,
          });
          if (updated) attendanceRecords.push(updated);
        } else {
          const newAttendance = await attendanceRepo.create({
            student_id: studentId,
            class_id: classId,
            date: new Date(date),
            status,
            marked_by_teacher_id: markedBy,
            notes,
          });
          attendanceRecords.push(newAttendance);
        }
      } catch (error) {
        errors.push({ index: i, error: String(error) });
      }
    }

    const { data: populatedRecords } = await attendanceRepo.findWithRelations({
      id: { $in: attendanceRecords.map(r => r.id) }
    });

    const formattedPopulated = populatedRecords.map((a: any) => ({
      _id: a.id,
      id: a.id,
      studentId: a.student ? { _id: a.student.id, firstName: a.student.first_name, lastName: a.student.last_name, admissionNo: a.student.admission_no } : a.student_id,
      classId: a.class ? { _id: a.class.id, name: a.class.name, section: a.class.section } : a.class_id,
      markedBy: a.teacher ? { _id: a.teacher.id, firstName: a.teacher.name, lastName: '' } : a.marked_by_teacher_id,
      date: a.date,
      status: a.status,
      notes: a.notes,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return NextResponse.json(
      {
        success: errors.length === 0,
        data: formattedPopulated,
        errors: errors.length > 0 ? errors : undefined,
        message:
          errors.length === 0
            ? `Successfully marked attendance for ${formattedPopulated.length} student(s)`
            : `Marked attendance for ${formattedPopulated.length} student(s) with ${errors.length} error(s)`,
      },
      { status: errors.length === 0 ? 201 : 207 }
    );
  } catch (error) {
    console.error("[POST /api/attendance/mark]", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

// GET - Get attendance by student or filter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, any> = {};

    if (studentId) filter.student_id = studentId;
    if (classId) filter.class_id = classId;

    if (startDate) {
      filter.startDate = new Date(startDate).toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.endDate = end.toISOString();
    }

    const attendanceRepo = new AttendanceRepository();
    const { data: attendance } = await attendanceRepo.findWithRelations(filter, {
      sort: { field: "date", ascending: false }
    });

    const formattedAttendance = attendance.map((a: any) => ({
      _id: a.id,
      id: a.id,
      studentId: a.student ? { _id: a.student.id, firstName: a.student.first_name, lastName: a.student.last_name, admissionNo: a.student.admission_no } : a.student_id,
      classId: a.class ? { _id: a.class.id, name: a.class.name, section: a.class.section } : a.class_id,
      markedBy: a.teacher ? { _id: a.teacher.id, firstName: a.teacher.name, lastName: '' } : a.marked_by_teacher_id,
      date: a.date,
      status: a.status,
      notes: a.notes,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedAttendance,
    });
  } catch (error) {
    console.error("[GET /api/attendance/mark]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

