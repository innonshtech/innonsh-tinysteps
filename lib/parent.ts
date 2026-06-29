import { supabaseAdmin } from "@/lib/supabase";

export async function parentOwnsStudent(studentId: string, loggedInParentId: string, parentEmail?: string) {
  // If the logged in user is directly the student (student login scenario)
  if (String(studentId) === String(loggedInParentId)) {
    const { data } = await supabaseAdmin.from('students').select('*').eq('id', studentId).single();
    if (data) return data;
  }

  // Otherwise, logged in as Parent (User model). Check the student_parents mapping.
  let query = supabaseAdmin.from('student_parents').select('*, students(*)').eq('student_id', studentId);
  
  if (parentEmail) {
    query = query.or(`parent_user_id.eq.${loggedInParentId},email.eq.${parentEmail}`);
  } else {
    query = query.eq('parent_user_id', loggedInParentId);
  }

  const { data } = await query.single();
  
  if (data?.students) {
    return { ...data.students, parents: [data] };
  }

  return null;
}