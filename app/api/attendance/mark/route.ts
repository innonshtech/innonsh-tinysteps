import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";

// POST - Mark attendance for one or multiple students
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { records, classId, date, markedBy } = body;

    // Validate input
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

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const { studentId, status, notes } = record;

      // Validate each record
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
        // Check if attendance already exists for this student on this date
        const existingAttendance = await Attendance.findOne({
          studentId,
          date: new Date(date),
        });

        if (existingAttendance) {
          // Update existing record
          existingAttendance.status = status;
          existingAttendance.notes = notes || existingAttendance.notes;
          existingAttendance.markedBy = markedBy;
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        } else {
          // Create new record
          const newAttendance = new Attendance({
            studentId,
            classId,
            date: new Date(date),
            status,
            markedBy,
            notes,
          });
          await newAttendance.save();
          attendanceRecords.push(newAttendance);
        }
      } catch (error) {
        errors.push({ index: i, error: String(error) });
      }
    }

    // Populate the records
    const populated = await Attendance.populate(attendanceRecords, [
      { path: "studentId", select: "firstName lastName admissionNo" },
      { path: "classId", select: "name section" },
      { path: "markedBy", select: "firstName lastName" },
    ]);

    return NextResponse.json(
      {
        success: errors.length === 0,
        data: populated,
        errors: errors.length > 0 ? errors : undefined,
        message:
          errors.length === 0
            ? `Successfully marked attendance for ${populated.length} student(s)`
            : `Marked attendance for ${populated.length} student(s) with ${errors.length} error(s)`,
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
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};

    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        (filter.date as Record<string, unknown>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (filter.date as Record<string, unknown>).$lte = end;
      }
    }

    const attendance = await Attendance.find(filter)
      .populate("studentId", "firstName lastName admissionNo")
      .populate("classId", "name section")
      .populate("markedBy", "firstName lastName")
      .sort({ date: -1 });

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("[GET /api/attendance/mark]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
