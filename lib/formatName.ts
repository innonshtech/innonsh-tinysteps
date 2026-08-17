export function formatPersonName(
  person?: {
    name?: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
  } | null,
  fallback = ""
): string {
  if (!person) return fallback;

  const rawName = person.name?.trim();
  if (rawName && rawName !== "undefined" && rawName !== "null") return rawName;

  const first = String(person.firstName || person.first_name || "")
    .replace(/^undefined$/i, "")
    .trim();
  const last = String(person.lastName || person.last_name || "")
    .replace(/^undefined$/i, "")
    .trim();
  const full = [first, last].filter(Boolean).join(" ").trim();

  return full || fallback;
}

export function formatStudentName(student?: Record<string, unknown> | null, fallback = "Student") {
  return formatPersonName(student as Parameters<typeof formatPersonName>[0], fallback);
}
