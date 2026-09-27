const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12,
};

function monthOf(name: string): number | undefined {
  return MONTHS[name.slice(0, 4)] ?? MONTHS[name.slice(0, 3)];
}

function iso(y: number, m: number, d: number) {
  if (y < 100) y += y >= 70 ? 1900 : 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Parses the date formats Nigerian banks export. Numeric dates are read day-first
 * (05/03/2026 is 5 March) unless `order` says otherwise.
 */
export function parseDate(raw: string, order: "dmy" | "mdy" = "dmy"): string | null {
  const s = raw.trim().toUpperCase();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) return order === "dmy" ? iso(+m[3], +m[2], +m[1]) : iso(+m[3], +m[1], +m[2]);

  m = s.match(/^(\d{1,2})(?:ST|ND|RD|TH)?[-\s/.]*([A-Z]{3,9})[-\s/.,]*(\d{2,4})\b/);
  if (m && monthOf(m[2])) return iso(+m[3], monthOf(m[2])!, +m[1]);

  m = s.match(/^([A-Z]{3,9})[-\s.]+(\d{1,2})(?:ST|ND|RD|TH)?,?[-\s.]+(\d{2,4})\b/);
  if (m && monthOf(m[1])) return iso(+m[3], monthOf(m[1])!, +m[2]);

  return null;
}

/** "₦1,250.50", "NGN 1,250.50", "(1,250.50)", "1,250.50 DR" → signed number. Blank or "-" → null. */
export function parseAmount(raw: string): number | null {
  let s = raw.trim().toUpperCase();
  if (!s || s === "-" || s === "--") return null;
  let sign = 1;
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1);
  }
  if (/DR\.?$/.test(s)) sign = -1;
  s = s.replace(/\s*(CR|DR)\.?$/, "").replace(/NGN|₦/g, "").replace(/^N(?=\s*[\d.])/, "").replace(/[,\s]/g, "");
  if (s.startsWith("-")) {
    sign = -sign;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const value = Number(s) * sign;
  return Number.isFinite(value) ? value : null;
}

/** Best-effort "who" from a bank narration, e.g. "NIP TRF FROM ADA OBI/GTB" → "Ada Obi". */
export function counterpartyFrom(narration: string) {
  const s = narration.replace(/\s+/g, " ").trim();
  const m =
    s.match(/\b(?:FROM|FRM)\s+(.+?)(?:\/|\s+-\s+|\s+TO\s+|\s+REF\b|$)/i) ??
    s.match(/\bTO\s+(.+?)(?:\/|\s+-\s+|\s+REF\b|$)/i);
  const raw = (m?.[1] ?? s).replace(/[^A-Za-z0-9&.' -]/g, " ").trim().slice(0, 48);
  return raw.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
