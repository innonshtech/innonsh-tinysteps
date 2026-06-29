import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { ExamRepository } from "@/repositories/exam.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10")));
    const classId = url.searchParams.get("classId");
    const classIds = url.searchParams.get("classIds");
    const status = url.searchParams.get("status");

    const skip = (page - 1) * limit;

    const repo = new ExamRepository();
    let query = repo.getClient().from('exams')
        .select('*, classId:classes(id, name, section), schedule:exam_schedule(*)', { count: 'exact' });

    if (classId) query = query.eq('class_id', classId);
    if (classIds) {
      const ids = classIds.split(",").filter(Boolean);
      if (ids.length > 0) query = query.in('class_id', ids);
    }
    if (status) query = query.eq('status', status);

    query = query.order('start_date', { ascending: false }).range(skip, skip + limit - 1);

    const { data: rawExams, count, error } = await query;
    if (error) throw error;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const exams = [];
    for (const raw of rawExams) {
        let computedStatus = raw.status;
        const start = new Date(raw.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(raw.end_date || raw.start_date);
        end.setHours(23, 59, 59, 999);

        if (now > end) {
            computedStatus = "completed";
        } else if (now >= start && now <= end) {
            computedStatus = "ongoing";
        } else {
            computedStatus = "scheduled";
        }

        // Fire and forget update if status changed
        if (computedStatus !== raw.status) {
            repo.update(raw.id, { status: computedStatus }).catch(console.error);
        }

        exams.push({
            _id: raw.id,
            id: raw.id,
            name: raw.name,
            description: raw.description,
            classId: raw.classId ? { _id: raw.classId.id, name: raw.classId.name, section: raw.classId.section } : null,
            subjects: raw.subjects,
            startDate: raw.start_date,
            endDate: raw.end_date,
            totalMarks: raw.total_marks,
            passingMarks: raw.passing_marks,
            examType: raw.exam_type,
            status: computedStatus,
            isPublished: raw.is_published,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
            schedule: raw.schedule ? raw.schedule.map((s: any) => ({
                _id: s.id,
                subject: s.subject,
                date: s.date,
                startTime: s.start_time,
                endTime: s.end_time,
                roomNumber: s.room_number,
                instructions: s.instructions
            })) : []
        });
    }

    return NextResponse.json({
      success: true,
      exams,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("[GET /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, classId, subjects, startDate, endDate, totalMarks, passingMarks, examType, schedule } = body;

    if (!name || !classId || !startDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repo = new ExamRepository();
    const createdRaw = await repo.create({
        name,
        description,
        class_id: classId,
        subjects: subjects || [],
        start_date: new Date(startDate).toISOString().split('T')[0],
        end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(startDate).toISOString().split('T')[0],
        total_marks: totalMarks || 100,
        passing_marks: passingMarks || 35,
        exam_type: examType || 'unit-test',
        status: 'scheduled'
    });

    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
        const scheduleInserts = schedule.map((s: any) => ({
            exam_id: createdRaw.id,
            subject: s.subject,
            date: s.date ? new Date(s.date).toISOString().split('T')[0] : null,
            start_time: s.startTime,
            end_time: s.endTime,
            room_number: s.roomNumber,
            instructions: s.instructions
        }));
        await repo.getClient().from('exam_schedule').insert(scheduleInserts);
    }

    // fetch full exam with populated classId
    const { data: fullExams } = await repo.getClient().from('exams')
        .select('*, classId:classes(id, name, section), schedule:exam_schedule(*)')
        .eq('id', createdRaw.id);
        
    const raw = fullExams && fullExams.length > 0 ? fullExams[0] : createdRaw;

    const exam = {
        _id: raw.id,
        id: raw.id,
        name: raw.name,
        description: raw.description,
        classId: raw.classId ? { _id: raw.classId.id, name: raw.classId.name, section: raw.classId.section } : classId,
        subjects: raw.subjects,
        startDate: raw.start_date,
        endDate: raw.end_date,
        totalMarks: raw.total_marks,
        passingMarks: raw.passing_marks,
        examType: raw.exam_type,
        status: raw.status,
        schedule: raw.schedule ? raw.schedule.map((s: any) => ({
            _id: s.id,
            subject: s.subject,
            date: s.date,
            startTime: s.start_time,
            endTime: s.end_time,
            roomNumber: s.room_number,
            instructions: s.instructions
        })) : (schedule || [])
    };

    // Log activity only for admin
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "create:exam",
        message: `Exam created: ${exam.name}`,
        metadata: {
          examId: exam.id,
          name: exam.name,
          examType: exam.examType,
          totalMarks: exam.totalMarks,
        },
      });
    }

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, schedule, classId, ...updateDataRaw } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }
    
    const updatePayload: any = { ...updateDataRaw };
    delete updatePayload._id;
    if (classId !== undefined) updatePayload.class_id = classId._id || classId.id || classId;
    if (updatePayload.startDate !== undefined) updatePayload.start_date = updatePayload.startDate ? new Date(updatePayload.startDate).toISOString().split('T')[0] : null;
    if (updatePayload.endDate !== undefined) updatePayload.end_date = updatePayload.endDate ? new Date(updatePayload.endDate).toISOString().split('T')[0] : null;
    if (updatePayload.totalMarks !== undefined) updatePayload.total_marks = updatePayload.totalMarks;
    if (updatePayload.passingMarks !== undefined) updatePayload.passing_marks = updatePayload.passingMarks;
    if (updatePayload.examType !== undefined) updatePayload.exam_type = updatePayload.examType;
    if (updatePayload.isPublished !== undefined) updatePayload.is_published = updatePayload.isPublished;
    delete updatePayload.startDate;
    delete updatePayload.endDate;
    delete updatePayload.totalMarks;
    delete updatePayload.passingMarks;
    delete updatePayload.examType;
    delete updatePayload.isPublished;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;

    const repo = new ExamRepository();
    const updatedRaw = await repo.update(id, updatePayload);

    if (!updatedRaw) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }
    
    if (schedule && Array.isArray(schedule)) {
        await repo.getClient().from('exam_schedule').delete().eq('exam_id', id);
        if (schedule.length > 0) {
            const scheduleInserts = schedule.map((s: any) => ({
                exam_id: id,
                subject: s.subject,
                date: s.date ? new Date(s.date).toISOString().split('T')[0] : null,
                start_time: s.startTime,
                end_time: s.endTime,
                room_number: s.roomNumber,
                instructions: s.instructions
            }));
            await repo.getClient().from('exam_schedule').insert(scheduleInserts);
        }
    }
    
    // fetch full updated object to return
    const { data: fullExams } = await repo.getClient().from('exams')
        .select('*, classId:classes(id, name, section), schedule:exam_schedule(*)')
        .eq('id', id);
        
    const raw = fullExams && fullExams.length > 0 ? fullExams[0] : updatedRaw;

    const exam = {
        _id: raw.id,
        id: raw.id,
        name: raw.name,
        description: raw.description,
        classId: raw.classId ? { _id: raw.classId.id, name: raw.classId.name, section: raw.classId.section } : classId,
        subjects: raw.subjects,
        startDate: raw.start_date,
        endDate: raw.end_date,
        totalMarks: raw.total_marks,
        passingMarks: raw.passing_marks,
        examType: raw.exam_type,
        status: raw.status,
        schedule: raw.schedule ? raw.schedule.map((s: any) => ({
            _id: s.id,
            subject: s.subject,
            date: s.date,
            startTime: s.start_time,
            endTime: s.end_time,
            roomNumber: s.room_number,
            instructions: s.instructions
        })) : []
    };

    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error("[PUT /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const repo = new ExamRepository();
    const exam = await repo.delete(id);

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/exams]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
