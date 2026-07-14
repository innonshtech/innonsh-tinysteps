import { NextResponse } from "next/server";
import { TeacherCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TeacherRepository } from "@/repositories/teacher.repository";

export async function GET(req: Request) {
  // allow admin and teacher list access; parents should not see
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const limit = Math.min(1000, parseInt(url.searchParams.get("limit") || "500"));

  const teacherRepo = new TeacherRepository();

  // If there's a search query, we fetch more and filter in memory, or we can use Supabase ilike
  // For simplicity with generic repo, if 'q' is provided we'll use a direct client call or just fetch all and filter
  let data;
  if (q) {
      const { data: rawData, error } = await teacherRepo.getClient()
        .from('teachers')
        .select('*')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      data = rawData;
  } else {
      const result = await teacherRepo.find({}, {
          limit,
          sort: { field: "created_at", ascending: false }
      });
      data = result;
  }

  // Fetch timetable to compute assigned classes
  const { data: timetables } = await teacherRepo.getClient().from('timetable').select('teacher_id, class_id');
  const teacherClasses: Record<string, string[]> = {};
  if (timetables) {
     for (const t of timetables) {
        if (!teacherClasses[t.teacher_id]) teacherClasses[t.teacher_id] = [];
        if (!teacherClasses[t.teacher_id].includes(t.class_id)) {
            teacherClasses[t.teacher_id].push(t.class_id);
        }
     }
  }

  // Map to Mongoose-like structure for frontend
  const teachers = data.map((t: any) => ({
      _id: t.id,
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      subjects: t.subjects || [],
      classes: teacherClasses[t.id] || [],
      qualifications: t.qualifications || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at
  }));

  return NextResponse.json({ success: true, data: teachers, teachers });
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/token=([^;]+)/)?.[1];
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Only admin can create teachers" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = TeacherCreateZ.parse(body);

    // Hash password before saving
    const hashedPassword = await bcryptjs.hash(parsed.password, 10);

    const teacherRepo = new TeacherRepository();
    const created = await teacherRepo.create({
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      phone: parsed.phone,
      subjects: parsed.subjects || [],
      qualifications: parsed.qualifications || [],
    });

    const teacher = {
        _id: created.id,
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        subjects: created.subjects || [],
        qualifications: created.qualifications || [],
        createdAt: created.created_at,
        updatedAt: created.updated_at
    };

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:teacher",
      message: `Teacher created: ${teacher.name}`,
      metadata: {
        teacherId: teacher.id,
        name: teacher.name,
        email: teacher.email,
      }
    });

    return NextResponse.json({ success: true, teacher }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Invalid" }, { status: 400 });
  }
}
