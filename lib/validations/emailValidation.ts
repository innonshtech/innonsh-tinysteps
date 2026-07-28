// lib/validations/emailValidation.ts

export interface EmailValidationResult {
  valid: boolean;
  type: "valid" | "syntax" | "gmail_typo";
  suggestion?: string;
  error?: string;
}

export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function checkGmailTypoDomain(domain: string): boolean {
  const d = domain.toLowerCase().trim();
  if (d === "gmail.com") return false;

  const LEGITIMATE_DOMAINS = [
    "yahoo.com",
    "yahoo.co.in",
    "outlook.com",
    "hotmail.com",
    "gmx.com",
    "icloud.com",
    "protonmail.com",
    "zoho.com",
    "aol.com",
    "live.com",
    "rediffmail.com",
    "ymail.com",
  ];

  if (LEGITIMATE_DOMAINS.includes(d)) {
    return false;
  }

  const EXACT_TYPOS = [
    "gmali.co",
    "gmali.com",
    "gamil.com",
    "gmai.com",
    "gmial.com",
    "gmal.com",
    "gmaill.com",
    "gmail.co",
    "gmail.con",
    "gmaiil.com",
    "gmasdil.com",
    "gmai.co",
    "gmaill.co",
    "gmaile.com",
    "gmaill.con",
    "gmai.con",
    "gmaail.com",
    "gmail.cm",
    "gmail.om",
    "gmaol.com",
    "gmal.co",
  ];
  if (EXACT_TYPOS.includes(d)) return true;

  const parts = d.split(".");
  if (parts.length < 2) return false;
  const name = parts[0];
  const tld = parts.slice(1).join(".");

  const nameDist = levenshtein(name, "gmail");

  if (nameDist <= 2) {
    const tldDist = levenshtein(tld, "com");
    if (tldDist <= 1 || tld === "co" || tld === "con" || tld === "cm" || tld === "om") {
      return true;
    }
  }

  if (name === "gmail" && tld !== "com") {
    const tldDist = levenshtein(tld, "com");
    if (tldDist <= 1 || tld === "co" || tld === "con" || tld === "cm" || tld === "om") {
      return true;
    }
  }

  return false;
}

export function normalizeEmail(email: string): string {
  const trimmed = (email || "").trim();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx === -1) return trimmed;
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1).toLowerCase();
  return `${local}@${domain}`;
}

export function validateParentLoginEmail(rawEmail: string): EmailValidationResult {
  const trimmed = (rawEmail || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }

  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx === -1) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }

  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1).toLowerCase();

  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(`${local}@${domain}`)) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }

  if (trimmed.includes("..")) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }

  if (local.startsWith(".") || local.endsWith(".")) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return {
      valid: false,
      type: "syntax",
      error: "Enter a valid email address.",
    };
  }

  if (checkGmailTypoDomain(domain)) {
    return {
      valid: false,
      type: "gmail_typo",
      suggestion: "gmail.com",
      error: "Email domain appears incorrect. Did you mean @gmail.com?",
    };
  }

  return { valid: true, type: "valid" };
}
