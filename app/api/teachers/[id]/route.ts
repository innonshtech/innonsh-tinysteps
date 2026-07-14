import { NextResponse, NextRequest } from "next/server";
import { TeacherCreateZ } from "@/lib/validations/teacherSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { logAdminActivity } from "@/lib/logAdminActivity";
import { TeacherRepository } from "@/repositories/teacher.repository";
import { supabaseAdmin } from "@/lib/supabase";

// ---------------------- GET ----------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const teacherRepo = new TeacherRepository();
  const rawTeacher = await teacherRepo.findById(id);
  
  if (!rawTeacher) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  
  // also get assigned classes
  const { data: assignments } = await teacherRepo.getClient()
    .from('teacher_class_assignments')
    .select('class_id')
    .eq('teacher_id', id);

  const teacher = {
      _id: rawTeacher.id,
      id: rawTeacher.id,
      name: rawTeacher.name,
      email: rawTeacher.email,
      phone: rawTeacher.phone,
      subjects: rawTeacher.subjects || [],
      qualifications: rawTeacher.qualifications || [],
      createdAt: rawTeacher.created_at,
      updatedAt: rawTeacher.updated_at,
      classes: assignments?.map(a => ({ classId: a.class_id })) || []
  };

  return NextResponse.json({ success: true, teacher });
}



// ---------------------- PUT ----------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log("Updating teacher with ID:", id);
  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || (!["admin"].includes(user.role) && user.role !== "teacher")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  console.log("User role:", user.role, "User ID:", user.id);

  try {
    const body = await req.json();

    if (user.role === "teacher" && String(user.id) !== String(id)) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only edit your own profile" }, { status: 403 });
    }

    const teacherRepo = new TeacherRepository();
    // Get old teacher data
    const oldTeacher = await teacherRepo.findById(id);
    if (!oldTeacher) return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

    // Hash password if provided
    const updateData: any = { ...body };
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }
    
    // Classes are handled separately
    const newClasses = updateData.classes;
    delete updateData.classes;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updated = await teacherRepo.update(id, updateData);

    if (!updated) {
      console.error("[api/teachers/[id]] Teacher not found:", id);
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    // --- SYNC LOGIC: Teacher -> Class ---
    // Update teacher_class_assignments
    if (newClasses && Array.isArray(newClasses)) {
      try {
        const { data: oldAssignments } = await teacherRepo.getClient()
            .from('teacher_class_assignments')
            .select('class_id')
            .eq('teacher_id', id);
            
        const oldClassIds = (oldAssignments || []).map((a: any) => String(a.class_id));
        const newClassIds = newClasses.map((c: any) => String(c.classId || c));

        const added = newClassIds.filter((cid: string) => !oldClassIds.includes(cid));
        const removed = oldClassIds.filter((cid: string) => !newClassIds.includes(cid));

        if (added.length > 0) {
            const inserts = added.map(cid => ({ teacher_id: id, class_id: cid }));
            await teacherRepo.getClient().from('teacher_class_assignments').insert(inserts);
        }
        if (removed.length > 0) {
            await teacherRepo.getClient().from('teacher_class_assignments')
                .delete()
                .eq('teacher_id', id)
                .in('class_id', removed);
        }
      } catch (syncError) {
        console.error("[api/teachers/[id]] Sync with classes failed:", syncError);
        // We don't fail the whole update just because class sync failed, but it's good to log
      }
    }
    // ------------------------------------

    // Log admin activity only if admin is updating
    if (user.role === "admin") {
      await logAdminActivity({
        actorId: String(user.id),
        actorRole: user.role,
        action: "update:teacher",
        message: `Teacher updated: ${updated.name}`,
        metadata: { teacherId: updated.id, name: updated.name, email: updated.email },
      });
    }

    const teacher = {
        _id: updated.id,
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        subjects: updated.subjects || [],
        qualifications: updated.qualifications || [],
    };

    return NextResponse.json({ success: true, teacher });
  } catch (err: any) {
    console.error("[api/teachers/[id]] Update failed:", err);
    return NextResponse.json({ success: false, error: err.message || "Invalid update data" }, { status: 400 });
  }
}



export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({
        success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Since users login differently, let's just use the decoded token role
    // The previous implementation used User.findById which assumed admin is in users.
    if (decoded.role !== "admin") {
      return NextResponse.json({
        success: false, error: "Only admin can delete teachers" }, { status: 403 });
    }

    const teacherRepo = new TeacherRepository();

    // 1. Fetch the teacher to get their name
    const teacher = await teacherRepo.findById(id);
      if (!teacher) {
        return NextResponse.json({
          success: false, error: "Teacher not found" }, { status: 404 });
    }

    // 2. Delete the teacher record (teacher_class_assignments deletes automatically via cascade)
    await teacherRepo.delete(id);

    // 3. Log admin activity
    await logAdminActivity({
      actorId: String(decoded.id),
      actorRole: decoded.role,
      action: "delete:teacher",
      message: `Teacher deleted: ${teacher.name}`,
      metadata: { teacherId: id, name: teacher.name, email: teacher.email },
    });

    return NextResponse.json({
        success: true, message: "Teacher deleted successfully" });
  } catch (error: any) {
    console.error("[api/teachers/delete] Error:", error);
    return NextResponse.json({
          success: false, error: error.message || "Failed to delete teacher" }, { status: 500 });
  }
}
