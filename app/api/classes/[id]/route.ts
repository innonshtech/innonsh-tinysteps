import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ClassCreateZ } from "@/lib/validations/classSchema";
import { supabaseAdmin } from "@/lib/supabase";
import { logAdminActivity } from "@/lib/logAdminActivity";

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
  const teacherIds = teacherAssignments?.map((t: any) => t.teacher_id) || [];
  let teachers: any[] = [];
  if (teacherIds.length > 0) {
    const { data: teacherData } = await supabaseAdmin.from('teachers').select('*').in('id', teacherIds);
    teachers = teacherData || [];
  }

  const mappedClass = {
    ...classData,
    _id: classData.id,
    roomNumber: classData.room_number,
    teachers: teachers.map((t: any) => ({ ...t, _id: t.id })),
    students: (students || []).map((s: any) => ({ ...s, _id: s.id }))
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

    const targetName = parsed.name ? parsed.name.trim() : oldClass.name;
    const targetSection = parsed.section ? parsed.section.trim() : oldClass.section;
    const targetRoom = parsed.roomNumber !== undefined ? parsed.roomNumber : oldClass.room_number;

    // 1. Check Class + Section uniqueness (excluding current class ID)
    if (parsed.name || parsed.section) {
      const { data: existingClassCombo } = await supabaseAdmin
        .from('classes')
        .select('id, name, section')
        .neq('id', id)
        .ilike('name', targetName)
        .ilike('section', targetSection)
        .maybeSingle();

      if (existingClassCombo) {
        return NextResponse.json(
          { success: false, error: `${targetName} - Section ${targetSection} already exists.` },
          { status: 409 }
        );
      }
    }

    // 2. Check Room Number uniqueness (excluding current class ID)
    if (targetRoom && String(targetRoom).trim() !== '') {
      const cleanRoom = String(targetRoom).trim();
      const { data: existingRoomOwner } = await supabaseAdmin
        .from('classes')
        .select('id, name, section, room_number')
        .neq('id', id)
        .ilike('room_number', cleanRoom)
        .maybeSingle();

      if (existingRoomOwner) {
        return NextResponse.json(
          {
            success: false,
            error: `Room ${cleanRoom} is already assigned to ${existingRoomOwner.name} - Section ${existingRoomOwner.section}.`,
          },
          { status: 409 }
        );
      }
    }

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
      const oldTeacherIds = existingAssignments?.map((a: any) => a.teacher_id) || [];
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

    // --- SYNC LOGIC: Class -> Student ---
    if (parsed.students) {
      const { data: currentStudents } = await supabaseAdmin.from('students').select('id').eq('class_id', id);
      const oldStudentIds = currentStudents?.map((s: any) => s.id) || [];
      const newStudentIds = parsed.students;

      const added = newStudentIds.filter((sid: string) => !oldStudentIds.includes(sid));
      const removed = oldStudentIds.filter((sid: string) => !newStudentIds.includes(sid));

      // Validate that newly added students are not assigned to a DIFFERENT class.
      // Students already in this class (class_id === id) are allowed.
      if (added.length > 0) {
        const { data: conflicting } = await supabaseAdmin
          .from('students')
          .select('id, class_id')
          .in('id', added)
          .not('class_id', 'is', null)
          .neq('class_id', id); // exclude students already in THIS class

        if (conflicting && conflicting.length > 0) {
          return NextResponse.json(
            { success: false, error: "Student is already assigned to another class." },
            { status: 400 }
          );
        }

        await supabaseAdmin.from('students')
          .update({ class_id: id })
          .in('id', added);
      }

      if (removed.length > 0) {
        await supabaseAdmin.from('students')
          .update({ class_id: null })
          .in('id', removed);
      }
    }
    // ------------------------------------

    // Log admin activity
    await logAdminActivity({
      actorId: String(user.id),
      actorRole: user.role,
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
  await logAdminActivity({
    actorId: String(user.id),
    actorRole: user.role,
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
