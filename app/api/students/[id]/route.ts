import { NextResponse, NextRequest } from "next/server";
import { StudentRepository } from "@/repositories/student.repository";
import { ClassRepository } from "@/repositories/class.repository";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { FeeTransactionRepository } from "@/repositories/fee.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { StudentCreateZ } from "@/lib/validations/studentSchema";
import { validateParentLoginEmail } from "@/lib/validations/emailValidation";
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
  const { students: rawStudents } = await studentRepo.findWithParents({ id });
  const student = rawStudents && rawStudents.length > 0 ? rawStudents[0] : await studentRepo.findById(id);

  if (!student)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const sAny = student as any;
  if (user?.role === "parent") {
    const parentsList = sAny.student_parents || sAny.parents || [];
    const allowed = parentsList.some(
      (p: any) => p.email === user.email || p.phone === user.email
    );

    if (!allowed)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const hasPassword = Boolean(student.password && String(student.password).trim().length > 0);
  const { password, ...studentRest } = student as any;

  const mappedStudent = {
    ...studentRest,
    _id: student.id,
    firstName: student.first_name,
    lastName: student.last_name,
    hasParentPassword: hasPassword,
    classId: student.class_id,
    class: sAny.class ? {
      _id: sAny.class.id,
      id: sAny.class.id,
      name: sAny.class.name,
      section: sAny.class.section,
    } : null,
    className: sAny.class?.name || "",
    section: sAny.class?.section || "",
    admissionNo: student.admission_no,
    admissionDate: student.admission_date,
    medicalAllergies: student.medical_allergies,
    medicalNotes: student.medical_notes,
    pickupPerson: student.pickup_person,
    pickupPhone: student.pickup_phone,
    medical: {
      allergies: student.medical_allergies || (sAny.medical?.allergies) || [],
      notes: student.medical_notes || (sAny.medical?.notes) || "",
    },
    pickupInfo: {
      pickupPerson: student.pickup_person || (sAny.pickupInfo?.pickupPerson) || "",
      pickupPhone: student.pickup_phone || (sAny.pickupInfo?.pickupPhone) || "",
    },
    parents: (sAny.student_parents || sAny.parents || []).map((p: any) => ({
      _id: p.id,
      id: p.id,
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      relation: p.relation || ""
    })),
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  };

  let attendanceSummary = {
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
    percentage: 0,
  };

  let feeSummary = {
    totalDue: 0,
    totalPaid: 0,
    totalPending: 0,
    status: "no_fees",
    recentTransactions: [] as any[],
  };

  try {
    const attendanceRepo = new AttendanceRepository();
    const attendanceRecords = await attendanceRepo.find({ student_id: id });
    if (attendanceRecords && attendanceRecords.length > 0) {
      const present = attendanceRecords.filter((a: any) => a.status === "present").length;
      const absent = attendanceRecords.filter((a: any) => a.status === "absent").length;
      const leave = attendanceRecords.filter((a: any) => a.status === "leave" || a.status === "late").length;
      const total = attendanceRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      attendanceSummary = { present, absent, leave, total, percentage };
    }
  } catch (err) {
    console.error("Error fetching attendance for student profile:", err);
  }

  try {
    const feeTxRepo = new FeeTransactionRepository();
    const feeTransactions = await feeTxRepo.find({ student_id: id }, { sort: { field: "created_at", ascending: false } });
    if (feeTransactions && feeTransactions.length > 0) {
      const totalDue = feeTransactions.reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);
      const totalPaid = feeTransactions.reduce((sum: number, t: any) => sum + (t.amount_paid || 0), 0);
      const totalPending = Math.max(0, totalDue - totalPaid);

      let status = "due";
      if (totalPending === 0 && totalDue > 0) {
        status = "paid";
      } else if (totalPaid > 0 && totalPending > 0) {
        status = "partial";
      }

      feeSummary = {
        totalDue,
        totalPaid,
        totalPending,
        status,
        recentTransactions: feeTransactions.slice(0, 5).map((t: any) => ({
          _id: t.id,
          amountDue: t.amount_due,
          amountPaid: t.amount_paid,
          status: t.status,
          dueDate: t.due_date,
          createdAt: t.created_at,
        })),
      };
    }
  } catch (err) {
    console.error("Error fetching fees for student profile:", err);
  }

  return NextResponse.json({
    success: true,
    student: {
      ...mappedStudent,
      attendanceSummary,
      feeSummary,
    },
  });
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
      cleanBody.parents = cleanBody.parents
        .map((p: any) => {
          if (p && typeof p === "object") {
            const name = typeof p.name === "string" ? p.name.trim() : "";
            const email = typeof p.email === "string" ? p.email.trim() : "";
            const phone = typeof p.phone === "string" ? p.phone.trim() : "";
            const relation = typeof p.relation === "string" ? p.relation.trim() : "";
            if (!name && !email && !phone && !relation) return null;
            return {
              name: name || undefined,
              email: email || undefined,
              phone: phone || undefined,
              relation: relation || undefined,
            };
          }
          return p;
        })
        .filter(Boolean);
      if (cleanBody.parents.length === 0) {
        delete cleanBody.parents;
      }
    }

    const targetEmail = cleanBody.email || (cleanBody.parents && cleanBody.parents[0]?.email);
    if (targetEmail) {
      const emailCheck = validateParentLoginEmail(targetEmail);
      if (!emailCheck.valid) {
        return NextResponse.json({
          success: false,
          error: emailCheck.error || "Invalid parent login email.",
        }, { status: 400 });
      }
    }

    const parsed = StudentCreateZ.partial().parse(cleanBody);

    if (parsed.password && parsed.password.trim() !== "") {
      parsed.password = await bcryptjs.hash(parsed.password, 10);
    } else {
      delete parsed.password;
    }

    let finalClassId: string | null | undefined = undefined;
    if (cleanBody.classId !== undefined) {
      if (cleanBody.classId && typeof cleanBody.classId === "string" && cleanBody.classId.trim() !== "" && cleanBody.classId !== "null") {
        const classRepo = new ClassRepository();
        const existingClass = await classRepo.findById(cleanBody.classId);
        if (existingClass) {
          finalClassId = existingClass.id;
        } else {
          return NextResponse.json({ success: false, error: "Invalid class selection." }, { status: 400 });
        }
      } else {
        finalClassId = null;
      }
    }

    const studentRepo = new StudentRepository();

    const updated = await studentRepo.update(id, {
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email,
      password: parsed.password,
      dob: parsed.dob ? new Date(parsed.dob) : undefined,
      gender: parsed.gender,
      class_id: finalClassId,
      admission_date: parsed.admissionDate ? new Date(parsed.admissionDate) : undefined,
      medical_allergies: parsed.medical?.allergies,
      medical_notes: parsed.medical?.notes,
      pickup_person: parsed.pickupInfo?.pickupPerson,
      pickup_phone: parsed.pickupInfo?.pickupPhone,
    });

    if (!updated)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Handle updating student_parents table if parents were provided
    if (cleanBody.parents && Array.isArray(cleanBody.parents) && cleanBody.parents.length > 0) {
      const validParents = cleanBody.parents.filter((p: any) => p.name);
      if (validParents.length > 0) {
        await studentRepo.getClient().from('student_parents').delete().eq('student_id', id);
        const parentInserts = validParents.map((p: any) => ({
          student_id: id,
          name: p.name,
          phone: p.phone || "",
          email: p.email || "",
          relation: p.relation || ""
        }));
        await studentRepo.getClient().from('student_parents').insert(parentInserts);
      }
    }

    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: String(user?.id),
      actor_role: user?.role || "unknown",
      action: "update:student",
      message: `Updated student: ${updated.first_name} ${updated.last_name || ""} (ID: ${id})`,
      result: 'success',
      metadata: { studentId: id, firstName: updated.first_name, lastName: updated.last_name, admissionNo: updated.admission_no },
    });

    const { students: updatedWithParents } = await studentRepo.findWithParents({ id });
    const finalStudent: any = updatedWithParents && updatedWithParents.length > 0 ? updatedWithParents[0] : updated;

    const hasPassword = Boolean(finalStudent.password && String(finalStudent.password).trim().length > 0);
    const { password, ...finalRest } = finalStudent as any;

    const mappedUpdated = {
      ...finalRest,
      _id: finalStudent.id,
      firstName: finalStudent.first_name,
      lastName: finalStudent.last_name,
      hasParentPassword: hasPassword,
      classId: finalStudent.class_id,
      class: finalStudent.class ? {
        _id: finalStudent.class.id,
        id: finalStudent.class.id,
        name: finalStudent.class.name,
        section: finalStudent.class.section,
      } : null,
      className: finalStudent.class?.name || "",
      section: finalStudent.class?.section || "",
      admissionNo: finalStudent.admission_no,
      admissionDate: finalStudent.admission_date,
      medicalAllergies: finalStudent.medical_allergies,
      medicalNotes: finalStudent.medical_notes,
      pickupPerson: finalStudent.pickup_person,
      pickupPhone: finalStudent.pickup_phone,
      medical: {
        allergies: finalStudent.medical_allergies || (finalStudent.medical?.allergies) || [],
        notes: finalStudent.medical_notes || (finalStudent.medical?.notes) || "",
      },
      pickupInfo: {
        pickupPerson: finalStudent.pickup_person || (finalStudent.pickupInfo?.pickupPerson) || "",
        pickupPhone: finalStudent.pickup_phone || (finalStudent.pickupInfo?.pickupPhone) || "",
      },
      parents: (finalStudent.student_parents || finalStudent.parents || []).map((p: any) => ({
        _id: p.id,
        id: p.id,
        name: p.name || "",
        phone: p.phone || "",
        email: p.email || "",
        relation: p.relation || ""
      })),
      createdAt: finalStudent.created_at,
      updatedAt: finalStudent.updated_at,
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
