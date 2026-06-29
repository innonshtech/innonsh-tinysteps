import { NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";

// GET - Get attendance summary for a student or class
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

    if (startDate) filter.startDate = new Date(startDate).toISOString();
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.endDate = end.toISOString();
    }

    const attendanceRepo = new AttendanceRepository();
    const { data: records } = await attendanceRepo.findWithRelations(filter);

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

    if (summary.total > 0) {
      summary.percentage = Math.round(((summary.present + summary.late) / summary.total) * 100);
      summary.presentPercentage = Math.round((summary.present / summary.total) * 100);
      summary.absentPercentage = Math.round((summary.absent / summary.total) * 100);
      summary.latePercentage = Math.round((summary.late / summary.total) * 100);
      summary.excusedPercentage = Math.round((summary.excused / summary.total) * 100);
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
    const body = await req.json();
    const { studentId, classId, month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: "month and year are required" },
        { status: 400 }
      );
    }

    const filter: Record<string, any> = {};

    if (studentId) filter.student_id = studentId;
    if (classId) filter.class_id = classId;

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    filter.startDate = startDate.toISOString();
    filter.endDate = endDate.toISOString();

    const attendanceRepo = new AttendanceRepository();
    const { data: records } = await attendanceRepo.findWithRelations(filter, { sort: { field: 'date', ascending: true } });

    const groupedData: Record<string, any> = {};

    if (classId && !studentId) {
      for (const record of records) {
        if (!record.student) continue;
        const student = record.student;
        const studentKey = String(student.id);

        if (!groupedData[studentKey]) {
          groupedData[studentKey] = {
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name || ''}`,
            admissionNo: student.admission_no,
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

        groupedData[studentKey].records.push(record);
      }

      Object.values(groupedData).forEach((entry: any) => {
        const summary = entry.summary;
        summary.present = entry.records.filter((r: any) => r.status === "present").length;
        summary.absent = entry.records.filter((r: any) => r.status === "absent").length;
        summary.late = entry.records.filter((r: any) => r.status === "late").length;
        summary.excused = entry.records.filter((r: any) => r.status === "excused").length;
        summary.total = entry.records.length;
        if (summary.total > 0) {
          summary.percentage = Math.round(((summary.present + summary.late) / summary.total) * 100);
        }
      });
    } else {
      const summary = {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        total: records.length,
        percentage: 0,
      };

      if (summary.total > 0) {
        summary.percentage = Math.round(((summary.present + summary.late) / summary.total) * 100);
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
