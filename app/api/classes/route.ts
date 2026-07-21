import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ClassCreateZ } from "@/lib/validations/classSchema";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { supabaseAdmin } from "@/lib/supabase";
import { ClassRepository } from "@/repositories/class.repository";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { StudentRepository } from "@/repositories/student.repository";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Admin + Teacher can fetch classes
    if (!["admin", "teacher"].includes(user.role))
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const limit = Math.min(500, parseInt(url.searchParams.get("limit") || "100"));

    let query = supabaseAdmin.from('classes').select(`
      *,
      teachers:teacher_class_assignments(
        teacher:teachers(*)
      ),
      students(*)
    `).limit(limit);

    if (q) {
      query = query.or(`name.ilike.%${q}%,section.ilike.%${q}%,room_number.ilike.%${q}%`);
    }

    const { data: rawClasses, error } = await query;
    if (error) throw error;

    let classes = rawClasses.map((c: any) => ({
      _id: c.id,
      id: c.id,
      name: c.name,
      section: c.section,
      roomNumber: c.room_number,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      teachers: c.teachers.map((t: any) => ({
        _id: t.teacher?.id,
        id: t.teacher?.id,
        name: t.teacher?.name,
        email: t.teacher?.email,
      })),
      students: c.students.map((s: any) => ({
        _id: s.id,
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
      }))
    }));

    // If user is a teacher, only show their assigned classes
    if (user.role === "teacher") {
      classes = classes.filter((c: any) => c.teachers.some((t: any) => String(t.id) === String(user.id)));
    }

    return NextResponse.json({ success: true, classes });
  } catch (err: any) {
    console.error("[GET /api/classes]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    if (!user || user.role !== "admin")
      return NextResponse.json({ success: false, error: "Only admin can create classes" }, { status: 403 });

    const body = await req.json();
    const parsed = ClassCreateZ.parse(body);

    const classRepo = new ClassRepository();
    const createdClass = await classRepo.create({
      name: parsed.name,
      section: parsed.section,
      room_number: parsed.roomNumber,
    });

    // If teachers are provided in the payload, assign them
    if (parsed.teachers && parsed.teachers.length > 0) {
      const assignments = parsed.teachers.map((tId: string) => ({
        teacher_id: tId,
        class_id: createdClass.id
      }));
      await supabaseAdmin.from('teacher_class_assignments').insert(assignments);
    }

    // If students are provided in the payload, assign them to this class
    if (parsed.students && parsed.students.length > 0) {
      await supabaseAdmin
        .from('students')
        .update({ class_id: createdClass.id })
        .in('id', parsed.students);
    }

    const formattedClass = {
        _id: createdClass.id,
        id: createdClass.id,
        name: createdClass.name,
        section: createdClass.section,
        roomNumber: createdClass.room_number,
        teachers: parsed.teachers || [],
        students: parsed.students || []
    };

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
      action: "create:class",
      message: `Class created: ${formattedClass.name} - ${formattedClass.section}`,
      metadata: {
        classId: formattedClass.id,
        name: formattedClass.name,
        section: formattedClass.section,
        roomNumber: formattedClass.roomNumber,
      }
    });

    return NextResponse.json({ success: true, class: formattedClass }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/classes]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
