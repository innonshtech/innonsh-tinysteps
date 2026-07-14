import { NextResponse, NextRequest } from "next/server";
import { StudentRepository } from "@/repositories/student.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { StudentCreateZ } from "@/lib/validations/studentSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";

// --------------------- GET ---------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  const studentRepo = new StudentRepository();
  const student = await studentRepo.findById(id);

  if (!student)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (user?.role === "parent") {
    // In PostgreSQL, parent relationship is typically handled in student_parents table.
    // For now, if parents is populated or we rely on email matching:
    const allowed =
      (student.parents || []).some(
        (p: any) => p.email === user.email || p.phone === user.email
      );

    if (!allowed)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Support old frontend components relying on _id
  const mappedStudent = {
    ...student,
    _id: student.id,
    firstName: student.first_name,
    lastName: student.last_name,
    classId: student.class_id,
    admissionNo: student.admission_no,
    admissionDate: student.admission_date,
    medicalAllergies: student.medical_allergies,
    medicalNotes: student.medical_notes,
    pickupPerson: student.pickup_person,
    pickupPhone: student.pickup_phone,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  };

  return NextResponse.json({ success: true, student: mappedStudent });
}

// --------------------- PUT ---------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;
      const copy: any = Array.isArray(obj) ? [] : {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string") {
          if (key === "name" || key === "firstName") {
            copy[key] = val.trim();
          } else {
            copy[key] = val.trim() === "" ? undefined : val;
          }
        } else if (Array.isArray(val)) {
          copy[key] = val.map((v) => 
                typeof v === "object" ? sanitize(v) : (typeof v === "string" && v.trim() === "" ? undefined : v)
              );
        } else if (val && typeof val === "object") {
          copy[key] = sanitize(val);
        } else {
          copy[key] = val;
        }
      }
      return copy;
    };

    const cleanBody = sanitize(body);
    if (Array.isArray(cleanBody.parents)) {
      cleanBody.parents = cleanBody.parents.map((p: any) => {
        if (p && typeof p === "object") {
          if (p.email === "" || p.email === undefined) delete p.email;
          if (p.phone === "" || p.phone === undefined) delete p.phone;
        }
        return p;
      });
    }

    const parsed = StudentCreateZ.partial().parse(cleanBody);

    if (parsed.password && parsed.password.trim() !== "") {
      parsed.password = await bcryptjs.hash(parsed.password, 10);
    } else {
      delete parsed.password;
    }

    const studentRepo = new StudentRepository();
    
    // Note: parents update might require separate repository handling in Supabase
    const updated = await studentRepo.update(id, {
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email,
      password: parsed.password,
      dob: parsed.dob ? new Date(parsed.dob) : undefined,
      gender: parsed.gender,
      class_id: parsed.classId,
      admission_date: parsed.admissionDate ? new Date(parsed.admissionDate) : undefined,
      medical_allergies: parsed.medical?.allergies,
      medical_notes: parsed.medical?.notes,
      pickup_person: parsed.pickupInfo?.pickupPerson,
      pickup_phone: parsed.pickupInfo?.pickupPhone,
    });

    if (!updated)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: String(user?.id),
      actor_role: user?.role || "unknown",
      action: "update:student",
      message: `Updated student: ${updated.first_name} ${updated.last_name || ""} (ID: ${id})`,
      result: 'success',
      metadata: { studentId: id, firstName: updated.first_name, lastName: updated.last_name, admissionNo: updated.admission_no },
    });

    const mappedUpdated = {
      ...updated,
      _id: updated.id,
      firstName: updated.first_name,
      lastName: updated.last_name,
      classId: updated.class_id,
      admissionNo: updated.admission_no,
      admissionDate: updated.admission_date,
      medicalAllergies: updated.medical_allergies,
      medicalNotes: updated.medical_notes,
      pickupPerson: updated.pickup_person,
      pickupPhone: updated.pickup_phone,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };

    return NextResponse.json({ success: true, student: mappedUpdated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Update failed" }, { status: 400 });
  }
}

// --------------------- DELETE ---------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Only admin can delete" }, { status: 403 });
  }

  const studentRepo = new StudentRepository();
  const student = await studentRepo.findById(id);

  if (!student)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  await studentRepo.delete(id);

  const logRepo = new LogActivityRepository();
  await logRepo.create({
    actor_id: String(user?.id),
    actor_role: user?.role || "unknown",
    action: "delete:student",
    message: `Deleted student: ${student.first_name} ${student.last_name || ""} (ID: ${id})`,
    result: 'success',
    metadata: { studentId: id, firstName: student.first_name, lastName: student.last_name, admissionNo: student.admission_no },
  });

  return NextResponse.json({ success: true, deletedId: id });
}
