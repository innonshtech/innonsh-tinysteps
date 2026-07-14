import { NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { StudentRepository } from "@/repositories/student.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";

// GET - List all attendance records with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const classIds = searchParams.get("classIds");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateParam = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const filter: Record<string, any> = {};

    if (studentId) filter.student_id = studentId;
    if (classId) filter.class_id = classId;
    if (classIds) {
      const ids = classIds.split(",").filter(Boolean);
      if (ids.length > 0) filter.class_id = { $in: ids };
    }
    if (status) filter.status = status;

    if (dateParam) {
      const [y, m, d] = dateParam.split("-").map(Number);
      filter.startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
      filter.endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
    } else {
      if (startDate) {
        const [sy, sm, sd] = startDate.split("-").map(Number);
        filter.startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0)).toISOString();
      }
      if (endDate) {
        const [ey, em, ed] = endDate.split("-").map(Number);
        filter.endDate = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999)).toISOString();
      }
    }

    const skip = (page - 1) * limit;

    const attendanceRepo = new AttendanceRepository();
    const { data: attendance, total } = await attendanceRepo.findWithRelations(filter, {
      skip,
      limit,
      sort: { field: "date", ascending: false }
    });

    // Map to Mongoose-like structure for frontend compatibility
    const formattedAttendance = attendance.map((a: any) => ({
      _id: a.id,
      id: a.id,
      studentId: a.student ? { _id: a.student.id, firstName: a.student.first_name, lastName: a.student.last_name, admissionNo: a.student.admission_no } : a.student_id,
      classId: a.class ? { _id: a.class.id, name: a.class.name, section: a.class.section } : a.class_id,
      markedBy: a.teacher ? { _id: a.teacher.id, firstName: a.teacher.name, lastName: '' } : 
               (a.user ? { _id: a.user.id, firstName: a.user.name, lastName: '' } : a.marked_by_user_id || a.marked_by_teacher_id),
      date: a.date,
      status: a.status,
      notes: a.notes,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: formattedAttendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST - Create attendance record(s)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, classId, date, status, markedBy, notes } = body;

    // Validate required fields
    if (!studentId || !date || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentId, date, status" },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ["present", "absent", "late", "excused"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const studentRepo = new StudentRepository();
    const student = await studentRepo.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const attendanceRepo = new AttendanceRepository();
    const created = await attendanceRepo.create({
      student_id: studentId,
      class_id: classId || student.class_id,
      date: new Date(date),
      status,
      marked_by_teacher_id: markedBy, // Assuming markedBy is a teacher ID
      notes,
    });

    const { data: populatedData } = await attendanceRepo.findWithRelations({ id: created.id });
    const populated = populatedData[0];
    
    let formattedPopulated = {
      _id: populated.id,
      id: populated.id,
      studentId: populated.student ? { _id: populated.student.id, firstName: populated.student.first_name, lastName: populated.student.last_name, admissionNo: populated.student.admission_no } : populated.student_id,
      classId: populated.class ? { _id: populated.class.id, name: populated.class.name, section: populated.class.section } : populated.class_id,
      markedBy: populated.teacher ? { _id: populated.teacher.id, firstName: populated.teacher.name, lastName: '' } : populated.marked_by_teacher_id,
      date: populated.date,
      status: populated.status,
      notes: populated.notes
    };

    if (markedBy) {
      // Typically we check if markedBy is admin, but since we separated roles into User/Teacher we might not have 'role' on markedBy easily.
      // For now, log the activity.
      const logRepo = new LogActivityRepository();
      await logRepo.create({
        actor_id: markedBy,
        action: "create:attendance",
        message: `Attendance marked for student`,
        result: 'success',
        metadata: {
          attendanceId: created.id,
          studentId: studentId,
          status: status,
        }
      });
    }

    return NextResponse.json(
      { success: true, data: formattedPopulated },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create attendance" },
      { status: 500 }
    );
  }
}

// PUT - Update attendance record
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, date, status, notes, markedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["present", "absent", "late", "excused"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);
    if (notes) updateData.notes = notes;
    if (markedBy) updateData.marked_by_teacher_id = markedBy;

    const attendanceRepo = new AttendanceRepository();
    const updated = await attendanceRepo.update(id, updateData);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const { data: populatedData } = await attendanceRepo.findWithRelations({ id: updated.id });
    const populated = populatedData[0];
    
    let formattedPopulated = {
      _id: populated.id,
      id: populated.id,
      studentId: populated.student ? { _id: populated.student.id, firstName: populated.student.first_name, lastName: populated.student.last_name, admissionNo: populated.student.admission_no } : populated.student_id,
      classId: populated.class ? { _id: populated.class.id, name: populated.class.name, section: populated.class.section } : populated.class_id,
      markedBy: populated.teacher ? { _id: populated.teacher.id, firstName: populated.teacher.name, lastName: '' } : populated.marked_by_teacher_id,
      date: populated.date,
      status: populated.status,
      notes: populated.notes
    };

    return NextResponse.json({ success: true, data: formattedPopulated });
  } catch (error) {
    console.error("[PUT /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance record
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const attendanceRepo = new AttendanceRepository();
    await attendanceRepo.delete(id);

    return NextResponse.json({ success: true, message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/attendance]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
