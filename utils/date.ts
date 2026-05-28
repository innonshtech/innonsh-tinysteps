export function toISODateInput(d?: string | Date) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}
