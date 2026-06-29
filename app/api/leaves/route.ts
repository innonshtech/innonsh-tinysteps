import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { LeaveRepository } from "@/repositories/leave.repository";
import { NotificationRepository } from "@/repositories/notification.repository";
import { UserRepository } from "@/repositories/user.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");
    const status = url.searchParams.get("status");

    const filter: Record<string, unknown> = {};

    // Teachers can only see their own leaves
    if (user.role === "teacher") {
      filter.teacher_id = user.id;
    } else if (teacherId) {
      filter.teacher_id = teacherId;
    }

    if (status) filter.status = status;

    const repo = new LeaveRepository();
    const leaves = await repo.find(filter, { sort: { field: 'created_at', ascending: false } });

    // Fetch teachers to populate teacher name
    const teacherRepo = new UserRepository(); // Or use TeacherRepository
    const { data: teachers } = await repo.getClient().from('teachers').select('id, name');
    const teacherMap: Record<string, any> = {};
    if (teachers) {
      for (const t of teachers) {
        teacherMap[t.id] = t;
      }
    }

    const mappedLeaves = leaves.map(l => ({
      ...l,
      _id: l.id,
      teacherId: teacherMap[l.teacher_id as string] || l.teacher_id,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      createdAt: l.created_at,
      adminRemarks: l.admin_remarks
    }));

    return NextResponse.json({ success: true, leaves: mappedLeaves });
  } catch (error) {
    console.error("[GET /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Only teachers can apply for leave" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveType, startDate, endDate, reason, attachment } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const repo = new LeaveRepository();
    const newLeave = await repo.create({
      teacher_id: user.id,
      leave_type: leaveType,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      reason,
      attachment,
      status: "pending",
    });

    // Fetch all admins to notify them
    const userRepo = new UserRepository();
    const admins = await userRepo.find({ role: "admin" });
    
    const notifRepo = new NotificationRepository();
    for (const admin of admins) {
      await notifRepo.create({
        recipient_id: admin.id,
        type: "leave",
        title: "New Leave Request",
        message: `A new ${leaveType} leave request was submitted.`,
        priority: "normal",
        icon: "Clock",
        action_url: "/dashboard/leaves"
      });
    }

    return NextResponse.json({ success: true, leave: { ...newLeave, _id: newLeave.id } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to apply for leave" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    // Only admins can approve/reject
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminRemarks } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status or missing ID" }, { status: 400 });
    }

    const repo = new LeaveRepository();
    const leave = await repo.update(id, {
      status,
      admin_remarks: adminRemarks
    });

    if (!leave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });

    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: String(user.id),
      actor_role: user.role,
      action: "update:leave",
      message: `Leave ${status} for teacher ${leave.teacher_id || "Unknown"}`,
      metadata: { leaveId: leave.id, status },
    });

    // Notify the teacher if they still exist
    if (leave.teacher_id) {
      const notifRepo = new NotificationRepository();
      await notifRepo.create({
        recipient_id: leave.teacher_id,
        type: "leave",
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your leave request for ${new Date(leave.start_date).toLocaleDateString()} has been ${status}.`,
        priority: "normal",
        icon: status === "approved" ? "CheckCircle2" : "XCircle",
        action_url: "/teacher-dashboard/leaves"
      });
    }

    return NextResponse.json({ success: true, leave: { ...leave, _id: leave.id } });
  } catch (error: any) {
    console.error("[PUT /api/leaves]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update leave" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "Missing leave ID" }, { status: 400 });

    const repo = new LeaveRepository();
    const leave = await repo.findById(id);
    if (!leave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });

    // A teacher can only cancel their own pending leave
    if (user.role === "teacher") {
      if (String(leave.teacher_id) !== String(user.id)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      if (leave.status !== "pending") {
        return NextResponse.json({ success: false, error: "Cannot cancel a processed leave" }, { status: 400 });
      }
    }

    await repo.update(id, { status: "cancelled" });

    return NextResponse.json({ success: true, message: "Leave cancelled successfully" });
  } catch (error) {
    console.error("[DELETE /api/leaves]", error);
    return NextResponse.json({ success: false, error: "Failed to cancel leave" }, { status: 500 });
  }
}
