import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ClassCreateZ } from "@/lib/validations/classSchema";
import { supabaseAdmin } from "@/lib/supabase";
import { LogActivityRepository } from "@/repositories/logactivity.repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: classData, error } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();

  if (!classData || error) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Get students
  const { data: students } = await supabaseAdmin.from('students').select('*').eq('class_id', id);
  
  // Get teachers
  const { data: teacherAssignments } = await supabaseAdmin.from('teacher_class_assignments').select('teacher_id').eq('class_id', id);
  const teacherIds = teacherAssignments?.map(t => t.teacher_id) || [];
  let teachers: any[] = [];
  if (teacherIds.length > 0) {
    const { data: teacherData } = await supabaseAdmin.from('teachers').select('*').in('id', teacherIds);
    teachers = teacherData || [];
  }

  const mappedClass = {
    ...classData,
    _id: classData.id,
    roomNumber: classData.room_number,
    teachers: teachers.map(t => ({ ...t, _id: t.id })),
    students: (students || []).map(s => ({ ...s, _id: s.id }))
  };

  return NextResponse.json({ success: true, class: mappedClass });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = ClassCreateZ.partial().parse(body);

    const { data: oldClass } = await supabaseAdmin.from('classes').select('*').eq('id', id).single();
    if (!oldClass) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const updateData: any = {};
    if (parsed.name) updateData.name = parsed.name;
    if (parsed.section) updateData.section = parsed.section;
    if (parsed.roomNumber !== undefined) updateData.room_number = parsed.roomNumber;

    const { data: updated, error } = await supabaseAdmin.from('classes').update(updateData).eq('id', id).select('*').single();

    if (!updated || error) {
      return NextResponse.json({ success: false, error: "Class not found after update" }, { status: 404 });
    }

    // --- SYNC LOGIC: Class -> Teacher ---
    if (parsed.teachers) {
      const { data: existingAssignments } = await supabaseAdmin.from('teacher_class_assignments').select('teacher_id').eq('class_id', id);
      const oldTeacherIds = existingAssignments?.map(a => a.teacher_id) || [];
      const newTeacherIds = parsed.teachers;

      const added = newTeacherIds.filter((tid: string) => !oldTeacherIds.includes(tid));
      const removed = oldTeacherIds.filter((tid: string) => !newTeacherIds.includes(tid));

      if (added.length > 0) {
        const insertData = added.map((tid: string) => ({ teacher_id: tid, class_id: id }));
        await supabaseAdmin.from('teacher_class_assignments').insert(insertData);
      }

      if (removed.length > 0) {
        await supabaseAdmin.from('teacher_class_assignments')
          .delete()
          .eq('class_id', id)
          .in('teacher_id', removed);
      }
    }
    // ------------------------------------

    // Log admin activity
    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: String(user.id),
      actor_role: user.role,
      action: "update:class",
      message: `Class updated: ${updated.name} - ${updated.section}`,
      metadata: {
        classId: updated.id,
        name: updated.name,
        section: updated.section,
        roomNumber: updated.room_number,
      }
    });

    const mappedUpdated = {
      ...updated,
      _id: updated.id,
      roomNumber: updated.room_number
    };

    return NextResponse.json({ success: true, class: mappedUpdated });
  } catch (err: any) {
    console.error("[api/classes/[id]] Update failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const { data: deleted, error } = await supabaseAdmin.from('classes').delete().eq('id', id).select('*').single();

  if (!deleted || error) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Log admin activity
  const logRepo = new LogActivityRepository();
  await logRepo.create({
    actor_id: String(user.id),
    actor_role: user.role,
    action: "delete:class",
    message: `Class deleted: ${deleted.name} - ${deleted.section}`,
    metadata: {
      classId: deleted.id,
      name: deleted.name,
      section: deleted.section,
      roomNumber: deleted.room_number,
    }
  });

  return NextResponse.json({ success: true, deletedId: id });
}
