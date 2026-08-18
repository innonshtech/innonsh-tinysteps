import { supabaseAdmin } from "@/lib/supabase";

export function mapStudentForClient(s: Record<string, unknown> | null, parents?: unknown[]) {
  if (!s) return null;

  const classInfo = s.class as { id?: string; name?: string; section?: string } | string | null | undefined;
  const classId =
    (s.class_id as string | null | undefined) ||
    (typeof classInfo === "object" && classInfo ? classInfo.id : undefined) ||
    (s.classId as string | undefined);

  const parentList = (parents || (s.student_parents as unknown[]) || (s.parents as unknown[]) || []) as Array<{
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    relation?: string;
  }>;

  const firstName = String((s.first_name as string | undefined) ?? (s.firstName as string | undefined) ?? "").trim();
  const lastName = String((s.last_name as string | undefined) ?? (s.lastName as string | undefined) ?? "").trim();

  return {
    _id: s.id || s._id,
    id: s.id || s._id,
    firstName,
    lastName,
    first_name: firstName,
    last_name: lastName,
    email: s.email,
    admissionNo: (s.admission_no as string | undefined) ?? (s.admissionNo as string | undefined) ?? "",
    admission_no: (s.admission_no as string | undefined) ?? (s.admissionNo as string | undefined) ?? "",
    admissionDate: (s.admission_date as string | undefined) ?? (s.admissionDate as string | undefined),
    classId,
    className: typeof classInfo === "object" && classInfo ? classInfo.name : (s.className as string | undefined),
    section: typeof classInfo === "object" && classInfo ? classInfo.section : (s.section as string | undefined),
    class:
      typeof classInfo === "object" && classInfo
        ? { _id: classInfo.id, id: classInfo.id, name: classInfo.name, section: classInfo.section }
        : classInfo,
    dob: s.dob,
    gender: s.gender,
    parents: parentList.map((p) => ({
      _id: p.id,
      id: p.id,
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      relation: p.relation || "",
    })),
  };
}

export async function getParentStudentIds(loggedInParentId: string, parentEmail?: string): Promise<string[]> {
  const ids = new Set<string>([loggedInParentId]);

  if (parentEmail) {
    const { data: byEmail } = await supabaseAdmin
      .from("student_parents")
      .select("student_id")
      .eq("email", parentEmail);
    byEmail?.forEach((m: any) => ids.add(m.student_id));
  }

  const { data: byUserId } = await supabaseAdmin
    .from("student_parents")
    .select("student_id")
    .eq("parent_user_id", loggedInParentId);
  byUserId?.forEach((m: any) => ids.add(m.student_id));

  return [...ids];
}

export async function getParentDisplayName(studentId: string, parentEmail?: string): Promise<string> {
  if (parentEmail) {
    const { data: byEmail } = await supabaseAdmin
      .from("student_parents")
      .select("name")
      .eq("student_id", studentId)
      .eq("email", parentEmail)
      .maybeSingle();
    if (byEmail?.name) return byEmail.name;

    const { data: byEmailOnly } = await supabaseAdmin
      .from("student_parents")
      .select("name")
      .eq("email", parentEmail)
      .limit(1)
      .maybeSingle();
    if (byEmailOnly?.name) return byEmailOnly.name;
  }

  const { data: firstParent } = await supabaseAdmin
    .from("student_parents")
    .select("name")
    .eq("student_id", studentId)
    .limit(1)
    .maybeSingle();

  return firstParent?.name || "";
}

export async function parentOwnsStudent(studentId: string, loggedInParentId: string, parentEmail?: string) {
  const allowedIds = await getParentStudentIds(loggedInParentId, parentEmail);
  if (!allowedIds.includes(studentId)) return null;

  const { data } = await supabaseAdmin
    .from("students")
    .select("*, class:classes(id, name, section), student_parents(*)")
    .eq("id", studentId)
    .single();

  if (!data) return null;
  return mapStudentForClient(data, data.student_parents);
}
