// app/api/students/route.ts
import { NextResponse } from "next/server";
import { StudentRepository } from "@/repositories/student.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { StudentCreateZ } from "@/lib/validations/studentSchema";
import { verifyToken } from "@/lib/auth";
import bcryptjs from "bcryptjs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (url.searchParams.get("classId")) filter.class_id = url.searchParams.get("classId");
  if (url.searchParams.get("classIds")) {
    const ids = url.searchParams.get("classIds")!.split(",").filter(Boolean);
    if (ids.length > 0) filter.class_id = { $in: ids };
  }
  if (url.searchParams.get("q")) {
    filter.searchQuery = url.searchParams.get("q");
  }

  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  const user = verifyToken(token);

  if (user?.role === "parent") {
    return NextResponse.json({ success: false, error: "Parents must use parent-portal endpoints" }, { status: 403 });
  }

  const studentRepo = new StudentRepository();
  const { students, total } = await studentRepo.findWithParents(filter, { 
    skip, 
    limit, 
    sort: { field: 'created_at', ascending: false } 
  });

  const mappedStudents = students.map((s: any) => ({
    ...s,
    _id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    classId: s.class_id,
    admissionNo: s.admission_no,
    admissionDate: s.admission_date,
    medicalAllergies: s.medical_allergies,
    medicalNotes: s.medical_notes,
    pickupPerson: s.pickup_person,
    pickupPhone: s.pickup_phone,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));

  return NextResponse.json({
    success: true,
    data: mappedStudents,
    students: mappedStudents,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  const user = verifyToken(token);

  if (!user || !["admin", "teacher"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    console.log("Creating student with data:", body);

    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;
      const copy: any = Array.isArray(obj) ? [] : {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string") {
          copy[key] = val.trim() === "" ? undefined : val;
        } else if (Array.isArray(val)) {
          copy[key] = val.map((v) =>
            typeof v === "string" && v.trim() === "" ? undefined : sanitize(v)
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
      }).filter((p: any) => p && (p.name || p.phone || p.email || p.relation));
    }

    const parsed = StudentCreateZ.parse(cleanBody);
    console.log("Parsed student data:", parsed);

    let hashedPassword = undefined;
    if (parsed.password) {
      hashedPassword = await bcryptjs.hash(parsed.password, 10);
    }

    const admissionNo = await import("@/lib/admissionNumber").then(m => m.generateAdmissionNo());

    const studentRepo = new StudentRepository();
    const created = await studentRepo.create({
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email,
      password: hashedPassword,
      dob: parsed.dob ? new Date(parsed.dob) : undefined,
      gender: parsed.gender,
      class_id: parsed.classId,
      admission_no: admissionNo,
      admission_date: parsed.admissionDate ? new Date(parsed.admissionDate) : undefined,
      medical_allergies: parsed.medical?.allergies,
      medical_notes: parsed.medical?.notes,
      pickup_person: parsed.pickupInfo?.pickupPerson,
      pickup_phone: parsed.pickupInfo?.pickupPhone,
    });

    console.log("Student created with ID:", created.id);

    // Create parents in student_parents table and link them
    if (parsed.parents && parsed.parents.length > 0) {
      const parentInserts = parsed.parents.map((p: any) => ({
        student_id: created.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        relation: p.relation
      }));
      await studentRepo.getClient().from('student_parents').insert(parentInserts);
    }
    const logRepo = new LogActivityRepository();
    await logRepo.create({
      actor_id: user?.id,
      actor_role: user?.role || "unknown",
      action: "create:student",
      message: `Created student: ${parsed.firstName} ${parsed.lastName || ""} (Admission No: ${admissionNo})`,
      result: 'success',
      metadata: { studentId: created.id, firstName: parsed.firstName, lastName: parsed.lastName, admissionNo: admissionNo },
    });

    return NextResponse.json({ success: true, student: { ...created, _id: created.id } }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating student:", err);

    let errorMessage = "Invalid data";

    if (err && typeof err === "object") {
        if (err.message) errorMessage = err.message;
        else if (err.code || err.details) errorMessage = JSON.stringify(err);
    }

    if (err?.issues) {
      errorMessage = err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
    }

    if (errorMessage.includes("duplicate key")) {
      errorMessage = "Duplicate entry found (e.g. Email or Admission No already exists)";
    }

    if (err instanceof Error && 'errors' in err) {
      const validationErrors = (err as any).errors as Array<any>;
      errorMessage = validationErrors
        .map((e: any) => {
          const field = e.path ? e.path.join('.') : "Field";
          return `${field}: ${e.message || String(e)}`;
        })
        .join(", ");
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 400 });
  }
}

