/**
 * Safely parses various date formats into a Javascript Date object.
 * Handles:
 * - Excel serial date numbers (e.g. 44298)
 * - Standard YYYY-MM-DD and YYYY/MM/DD formats
 * - Regional DD/MM/YYYY and DD-MM-YYYY formats (common in India, UK, Europe)
 * - Standard JS parseable date strings
 */
export function parseDate(dateVal: any): Date | null {
  if (dateVal === null || dateVal === undefined) return null;

  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  // Handle Excel serial date numbers (usually represented as numeric strings/numbers between 1900 and 2100 years, approx 1 to 75000+)
  const num = Number(dateVal);
  if (!isNaN(num) && num > 20000 && num < 60000) {
    // Excel dates are number of days since Dec 30, 1899
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // 1. Match YYYY-MM-DD or YYYY/MM/DD (e.g., 2021-04-12 or 2021/04/12)
  const matchYMD = str.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
  if (matchYMD) {
    const year = parseInt(matchYMD[1], 10);
    const month = parseInt(matchYMD[2], 10);
    const day = parseInt(matchYMD[3], 10);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 2. Match DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY or MM-DD-YYYY
  const matchDMY = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (matchDMY) {
    const part1 = parseInt(matchDMY[1], 10);
    const part2 = parseInt(matchDMY[2], 10);
    const year = parseInt(matchDMY[3], 10);

    let day = part1;
    let month = part2;

    if (part1 > 12) {
      // Must be DD/MM/YYYY (e.g., 18/08/2026)
      day = part1;
      month = part2;
    } else if (part2 > 12) {
      // Must be MM/DD/YYYY (e.g., 08/18/2026)
      day = part2;
      month = part1;
    } else {
      // Ambiguous (both <= 12, e.g., 04/12/2021).
      // Default to DD/MM/YYYY since it is the standard format outside the US
      // and aligned with Indian context (timezone +05:30).
      day = part1;
      month = part2;
    }

    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 3. Fallback to standard JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}
