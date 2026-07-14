import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { SubstituteAssignmentRepository, LeaveRepository } from "@/repositories/leave.repository";
import { NotificationRepository } from "@/repositories/notification.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const substituteTeacherId = url.searchParams.get("substituteTeacherId");

    const filter: Record<string, unknown> = { status: "assigned" };

    if (date) {
      // Find assignments exactly on this date
      filter.date = new Date(date).toISOString().split('T')[0]; // Simple string match or rely on repo querying
      // We'll pass it to find() and hope the repository can handle Date exact match 
      // or we just map it. Supabase exact match on date column works if it's formatted YYYY-MM-DD.
    }

    if (user.role === "teacher") {
      filter.substitute_teacher_id = user.id;
    } else if (substituteTeacherId) {
      filter.substitute_teacher_id = substituteTeacherId;
    }

    const repo = new SubstituteAssignmentRepository();
    const assignments = await repo.find(filter, { sort: { field: 'date', ascending: true } });

    // Map to frontend expected format
    const mappedAssignments = assignments.map((a: any) => ({
      ...a,
      _id: a.id,
      leaveId: a.leave_id,
      originalTeacherId: a.original_teacher_id,
      substituteTeacherId: a.substitute_teacher_id,
      classId: a.class_id,
      startTime: a.start_time,
      endTime: a.end_time
    }));

    return NextResponse.json({ success: true, assignments: mappedAssignments });
  } catch (error) {
    console.error("[GET /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch substitutes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveId, originalTeacherId, substituteTeacherId, classId, subject, date, startTime, endTime } = body;

    if (!leaveId || !originalTeacherId || !substituteTeacherId || !classId || !subject || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify leave exists and is approved
    const leaveRepo = new LeaveRepository();
    const leave = await leaveRepo.findById(leaveId);
    if (!leave || leave.status !== "approved") {
      return NextResponse.json({ success: false, error: "Valid approved leave is required" }, { status: 400 });
    }

    const repo = new SubstituteAssignmentRepository();
    const newAssignment = await repo.create({
      leave_id: leaveId,
      original_teacher_id: originalTeacherId,
      substitute_teacher_id: substituteTeacherId,
      class_id: classId,
      subject,
      date: new Date(date),
      start_time: startTime,
      end_time: endTime,
      status: "assigned",
    });

    // Notify the substitute teacher
    const notifRepo = new NotificationRepository();
    await notifRepo.create({
      recipient_id: substituteTeacherId,
      type: "leave",
      title: "New Substitute Assignment",
      message: `You have been assigned as a substitute for ${subject} on ${new Date(date).toLocaleDateString()} from ${startTime} to ${endTime}.`,
      priority: "high",
      icon: "Calendar",
      action_url: "/teacher-dashboard/timetable"
    });

    return NextResponse.json({ success: true, assignment: { ...newAssignment, _id: newAssignment.id } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to assign substitute" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const repo = new SubstituteAssignmentRepository();
    const assignment = await repo.findById(id);
    if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });

    await repo.update(id, { status: "cancelled" });

    return NextResponse.json({ success: true, message: "Substitute assignment cancelled" });
  } catch (error) {
    console.error("[DELETE /api/substitutes]", error);
    return NextResponse.json({ success: false, error: "Failed to cancel assignment" }, { status: 500 });
  }
}
