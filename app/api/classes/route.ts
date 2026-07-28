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
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

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

    // 1. Parallel Pre-Validation Checks (Class + Section Uniqueness AND Room Number Uniqueness)
    const comboCheckPromise = supabaseAdmin
      .from('classes')
      .select('id, name, section')
      .ilike('name', parsed.name.trim())
      .ilike('section', parsed.section.trim())
      .maybeSingle();

    const roomCheckPromise = (parsed.roomNumber && parsed.roomNumber.trim() !== '')
      ? supabaseAdmin
          .from('classes')
          .select('id, name, section, room_number')
          .ilike('room_number', parsed.roomNumber.trim())
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [{ data: existingClassCombo }, { data: existingRoomOwner }] = await Promise.all([
      comboCheckPromise,
      roomCheckPromise,
    ]);

    if (existingClassCombo) {
      return NextResponse.json(
        { success: false, error: `${parsed.name.trim()} - Section ${parsed.section.trim()} already exists.` },
        { status: 409 }
      );
    }

    if (existingRoomOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Room ${(parsed.roomNumber || "").trim()} is already assigned to ${existingRoomOwner.name} - Section ${existingRoomOwner.section}.`,
        },
        { status: 409 }
      );
    }

    // 2. Class INSERT
    const classRepo = new ClassRepository();
    const createdClass = await classRepo.create({
      name: parsed.name,
      section: parsed.section,
      room_number: parsed.roomNumber,
    });

    // 3. Parallel Post-Insert Tasks (Teacher Assignments + Student Eligibility & Update)
    const assignTeachersTask = (async () => {
      if (parsed.teachers && parsed.teachers.length > 0) {
        const assignments = parsed.teachers.map((tId: string) => ({
          teacher_id: tId,
          class_id: createdClass.id,
        }));
        await supabaseAdmin.from('teacher_class_assignments').insert(assignments);
      }
    })();

    const assignStudentsTask = (async () => {
      if (parsed.students && parsed.students.length > 0) {
        const { data: selectedStudents, error: fetchError } = await supabaseAdmin
          .from('students')
          .select('id, class_id')
          .in('id', parsed.students);

        if (fetchError) throw fetchError;

        const conflicting = (selectedStudents || []).filter(
          (s: any) => s.class_id !== null && s.class_id !== undefined
        );

        if (conflicting.length > 0) {
          throw new Error("STUDENT_ALREADY_ASSIGNED");
        }

        await supabaseAdmin
          .from('students')
          .update({ class_id: createdClass.id })
          .in('id', parsed.students);
      }
    })();

    try {
      await Promise.all([assignTeachersTask, assignStudentsTask]);
    } catch (assignErr: any) {
      if (assignErr.message === "STUDENT_ALREADY_ASSIGNED") {
        await supabaseAdmin.from('classes').delete().eq('id', createdClass.id);
        return NextResponse.json(
          { success: false, error: "Student is already assigned to another class." },
          { status: 400 }
        );
      }
      throw assignErr;
    }

    const formattedClass = {
      _id: createdClass.id,
      id: createdClass.id,
      name: createdClass.name,
      section: createdClass.section,
      roomNumber: createdClass.room_number,
      teachers: parsed.teachers || [],
      students: parsed.students || [],
    };

    // 4. Reliable Audit Logging (passing actorEmail: user.email to prevent extra DB lookup)
    await logAdminActivity({
      actorId: String(user.id),
      actorEmail: user.email,
      actorRole: user.role,
      action: "create:class",
      message: `Class created: ${formattedClass.name} - ${formattedClass.section}`,
      metadata: {
        classId: formattedClass.id,
        name: formattedClass.name,
        section: formattedClass.section,
        roomNumber: formattedClass.roomNumber,
      },
    });

    return NextResponse.json({ success: true, class: formattedClass }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/classes]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
