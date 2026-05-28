import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";

// GET - Get attendance summary for a student or class
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

    // Get all attendance records matching filter
    const records = await Attendance.find(filter).lean();

    // Calculate summary statistics
    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      excused: records.filter((r) => r.status === "excused").length,
      percentage: 0,
      presentPercentage: 0,
      absentPercentage: 0,
      latePercentage: 0,
      excusedPercentage: 0,
    };

    // Calculate percentages
    if (summary.total > 0) {
      summary.percentage = Math.round(
        ((summary.present + summary.late) / summary.total) * 100
      );
      summary.presentPercentage = Math.round(
        (summary.present / summary.total) * 100
      );
      summary.absentPercentage = Math.round(
        (summary.absent / summary.total) * 100
      );
      summary.latePercentage = Math.round(
        (summary.late / summary.total) * 100
      );
      summary.excusedPercentage = Math.round(
        (summary.excused / summary.total) * 100
      );
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("[GET /api/attendance/summary]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance summary" },
      { status: 500 }
    );
  }
}

// POST - Get monthly summary for class or student
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { studentId, classId, month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: "month and year are required" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = {};

    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;

    // Set date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    filter.date = { $gte: startDate, $lte: endDate };

    const records = await Attendance.find(filter)
      .populate("studentId", "firstName lastName admissionNo")
      .sort({ date: 1 })
      .lean();

    // Group by student if classId is provided
    const groupedData: Record<string, unknown> = {};

    if (classId && !studentId) {
      for (const record of records) {
        const student = record.studentId as Record<string, unknown>;
        const studentKey = String(student._id);

        if (!groupedData[studentKey]) {
          groupedData[studentKey] = {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            admissionNo: student.admissionNo,
            records: [],
            summary: {
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              total: 0,
              percentage: 0,
            },
          };
        }

        (groupedData[studentKey] as Record<string, unknown>).records = [
          ...((groupedData[studentKey] as Record<string, unknown>).records as unknown[]),
          record,
        ];
      }

      // Calculate summary for each student
      Object.values(groupedData).forEach((entry) => {
        const entryData = entry as Record<string, unknown>;
        const entryRecords = entryData.records as unknown[];
        const summary = entryData.summary as Record<string, number>;
        summary.present = entryRecords.filter((r: unknown) => (r as Record<string, unknown>).status === "present").length;
        summary.absent = entryRecords.filter((r: unknown) => (r as Record<string, unknown>).status === "absent").length;
        summary.late = entryRecords.filter((r: unknown) => (r as Record<string, unknown>).status === "late").length;
        summary.excused = entryRecords.filter((r: unknown) => (r as Record<string, unknown>).status === "excused").length;
        summary.total = entryRecords.length;
        summary.percentage = Math.round(
          ((summary.present + summary.late) / summary.total) * 100
        );
      });
    } else {
      // Single student summary
      const summary = {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        total: records.length,
        percentage: 0,
      };

      if (summary.total > 0) {
        summary.percentage = Math.round(
          ((summary.present + summary.late) / summary.total) * 100
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          month,
          year,
          summary,
          records,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        students: Object.values(groupedData),
      },
    });
  } catch (error) {
    console.error("[POST /api/attendance/summary]", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate attendance summary" },
      { status: 500 }
    );
  }
}
