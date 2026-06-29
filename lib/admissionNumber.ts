// lib/admissionNumber.ts
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Generate a new Admission Number in the format:
 *   ADM-<YEAR>-<6_DIGIT_SEQUENCE>
 * Example: ADM-2026-000001
 */
export async function generateAdmissionNo(prefix = "ADM") {
  const year = new Date().getFullYear();
  const searchPattern = `${prefix}-${year}-%`;

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("admission_no")
    .like("admission_no", searchPattern)
    .order("admission_no", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error generating admission number:", error);
    throw error;
  }

  let nextSeq = 1;
  if (data && data.length > 0 && data[0].admission_no) {
    const parts = data[0].admission_no.split("-");
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSeq = currentSeq + 1;
      }
    }
  }

  const seqPadded = String(nextSeq).padStart(6, "0");
  return `${prefix}-${year}-${seqPadded}`;
}

