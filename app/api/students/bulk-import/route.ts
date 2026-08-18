import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { StudentRepository } from "@/repositories/student.repository";
import { ClassRepository } from "@/repositories/class.repository";
import { LogActivityRepository } from "@/repositories/logactivity.repository";
import { generateAdmissionNo } from "@/lib/admissionNumber";
import bcryptjs from "bcryptjs";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid student data list" }, { status: 400 });
    }

    const studentRepo = new StudentRepository();
    const classRepo = new ClassRepository();
    const logRepo = new LogActivityRepository();

    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    // Cache classes to prevent redundant lookups
    const classCache: Record<string, string> = {};

    // Generate hash for default parent password
    const defaultHashedPassword = await bcryptjs.hash("parent123", 10);

    for (let idx = 0; idx < students.length; idx++) {
      const s = students[idx];
      const rowNum = idx + 2; // Row number in spreadsheet (accounting for header)

      try {
        const firstName = s.firstName?.trim();
        if (!firstName) {
          throw new Error(`Row ${rowNum}: First Name is required`);
        }

        const dobVal = s.dob ? new Date(s.dob) : null;
        if (!dobVal || isNaN(dobVal.getTime())) {
          throw new Error(`Row ${rowNum}: Invalid Date of Birth`);
        }

        const parentEmail = s.parentEmail?.trim().toLowerCase();
        if (!parentEmail) {
          throw new Error(`Row ${rowNum}: Parent Email is required`);
        }

        // 1. Resolve Class
        let classId: string | null = null;
        const className = s.className?.trim();
        const section = s.section?.trim().toUpperCase() || "A";

        if (className) {
          const cacheKey = `${className.toLowerCase()}_${section.toLowerCase()}`;
          if (classCache[cacheKey]) {
            classId = classCache[cacheKey];
          } else {
            // Find existing class
            const { data: existingClass } = await classRepo.getClient()
              .from('classes')
              .select('id')
              .ilike('name', className)
              .ilike('section', section)
              .maybeSingle();

            if (existingClass) {
              classId = existingClass.id;
            } else {
              // Automatically create class if it does not exist
              const newClass = await classRepo.create({
                name: className.replace(/\s+/g, " "),
                section,
              });
              classId = newClass.id;
            }
            classCache[cacheKey] = classId as string;
          }
        }

        // 2. Resolve Admission Number
        let admissionNo = s.admissionNo?.trim();
        if (!admissionNo) {
          admissionNo = await generateAdmissionNo();
        } else {
          // Verify admission number uniqueness
          const { data: existingAdNo } = await studentRepo.getClient()
            .from('students')
            .select('id')
            .eq('admission_no', admissionNo)
            .maybeSingle();

          if (existingAdNo) {
            throw new Error(`Row ${rowNum}: Duplicate Admission Number "${admissionNo}"`);
          }
        }

        // Parse medical allergies
        let allergies: string[] = [];
        if (s.medicalAllergies) {
          allergies = String(s.medicalAllergies)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
        }

        // 3. Create Student
        const createdStudent = await studentRepo.create({
          first_name: firstName,
          last_name: s.lastName?.trim() || undefined,
          email: parentEmail,
          password: defaultHashedPassword,
          dob: dobVal,
          gender: s.gender?.trim() || "Other",
          class_id: classId || undefined,
          admission_no: admissionNo,
          admission_date: s.admissionDate ? new Date(s.admissionDate) : new Date(),
          medical_allergies: allergies,
          medical_notes: s.medicalNotes?.trim() || undefined,
          pickup_person: s.pickupPerson?.trim() || undefined,
          pickup_phone: s.pickupPhone?.trim() || undefined,
        });

        // 4. Create Parent Profile
        if (s.parentName?.trim()) {
          await studentRepo.getClient().from('student_parents').insert({
            student_id: createdStudent.id,
            name: s.parentName.trim(),
            phone: s.parentPhone?.trim() || undefined,
            email: parentEmail,
            relation: s.parentRelation?.trim() || "Father",
          });
        }

        results.successCount++;
      } catch (err: any) {
        results.failedCount++;
        results.errors.push(err.message || `Row ${rowNum}: Unknown validation error`);
      }
    }

    if (results.successCount > 0) {
      await logRepo.create({
        actor_id: user.id,
        actor_role: user.role,
        action: "import:students:bulk",
        message: `Bulk imported ${results.successCount} students successfully (${results.failedCount} failures)`,
        result: 'success',
        metadata: { successCount: results.successCount, failedCount: results.failedCount },
      });
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err: any) {
    console.error("[bulk-import api error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
