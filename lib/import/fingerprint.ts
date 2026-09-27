import { createHash } from "node:crypto";

import type { ParsedLine } from "./types";

/**
 * A stable id for each imported line. Identical lines on the same day (two ₦500 transfers)
 * are told apart by their order in the file, so re-importing the same statement, or an
 * overlapping one, adds nothing twice.
 */
export function fingerprintLines(accountId: string, lines: ParsedLine[]) {
  const seen = new Map<string, number>();
  return lines.map((line) => {
    const amountKobo = Math.round(line.amount * 100);
    const base = [accountId, line.date, amountKobo, line.type, line.narration.toUpperCase().replace(/\s+/g, " ").trim()].join("|");
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    const hash = createHash("sha256").update(`${base}|${occurrence}`).digest("hex").slice(0, 40);
    return { ...line, amountKobo, hash };
  });
}
