import { counterpartyFrom, parseAmount, parseDate } from "./fields";
import type { ParsedLine } from "./types";

const CREDIT = /\b(CR|CREDIT(?:ED)?|RECEIVED|DEPOSIT(?:ED)?|INFLOW|LODGEMENT)\b/i;
const DEBIT = /\b(DR|DEBIT(?:ED)?|SENT|WITHDRAWAL|WITHDRAWN|PAID|PURCHASE|OUTFLOW|TRANSFERRED)\b/i;
const AMOUNT = /(?:NGN|₦)\s?([\d,]+(?:\.\d{1,2})?)|\bAmt\s*[:\-]\s*(?:NGN|₦|N)?\s?([\d,]+(?:\.\d{1,2})?)/i;
// Labels can sit on their own lines or run together on one SMS line, so each value stops
// at the next known label.
const NEXT_LABEL = String.raw`(?=\s+(?:date|time|avail(?:able)?|bal(?:ance)?|desc|ref|amt|acct)\b\.?\s*[:\-]|\n|$)`;
const LABELLED_DESC = new RegExp(
  String.raw`(?:^|\s)(?:desc(?:ription)?|narr(?:ation)?|remarks?|details?|purpose|memo)\s*[:\-]\s*(.+?)` + NEXT_LABEL,
  "im"
);
const LABELLED_DATE = new RegExp(String.raw`(?:^|\s)(?:date|time|dt)\s*[:\-]\s*(.+?)` + NEXT_LABEL, "im");
const ANY_DATE =
  /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[-\s,]*\d{2,4})\b/i;

export type AlertParseResult = { lines: ParsedLine[]; unparsed: string[] };

/**
 * Reads pasted debit/credit alerts (SMS or email). Separate alerts with a blank line.
 * Alerts without a date use `fallbackDate`.
 */
export function parseAlerts(text: string, fallbackDate: string): AlertParseResult {
  const chunks = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const lines: ParsedLine[] = [];
  const unparsed: string[] = [];

  for (const chunk of chunks) {
    const amountMatch = chunk.match(AMOUNT);
    const amount = amountMatch ? parseAmount(amountMatch[1] ?? amountMatch[2] ?? "") : null;
    const type = direction(chunk, amountMatch?.index ?? 0);
    if (!amount || !type) {
      unparsed.push(chunk);
      continue;
    }

    const labelledDate = chunk.match(LABELLED_DATE)?.[1];
    const date =
      (labelledDate && parseDate(labelledDate)) ||
      parseDate(chunk.match(ANY_DATE)?.[1] ?? "") ||
      fallbackDate;

    const narration = (
      chunk.match(LABELLED_DESC)?.[1] ??
      chunk.match(/\b((?:from|to)\s+[A-Z][^.\n]{2,60}?)(?=\s+(?:on|at)\s+\d|[.\n]|$)/i)?.[1] ??
      chunk.split("\n")[0]
    )
      .replace(/\s+/g, " ")
      .trim();

    lines.push({ date, amount: Math.abs(amount), type, narration, counterparty: counterpartyFrom(narration) });
  }

  return { lines, unparsed };
}

/** Credit or debit. When both words appear, the one closest after the amount wins. */
function direction(chunk: string, amountIndex: number): ParsedLine["type"] | null {
  const explicit = chunk.match(/\b(?:txn|type|trans(?:action)?\s*type)\s*[:\-]\s*(credit|debit|cr|dr)\b/i)?.[1];
  if (explicit) return /^c/i.test(explicit) ? "credit" : "debit";

  const after = chunk.slice(amountIndex, amountIndex + 40);
  const c = after.search(CREDIT);
  const d = after.search(DEBIT);
  if (c >= 0 || d >= 0) {
    if (c < 0) return "debit";
    if (d < 0) return "credit";
    return c < d ? "credit" : "debit";
  }
  const ci = chunk.search(CREDIT);
  const di = chunk.search(DEBIT);
  if (ci < 0 && di < 0) return null;
  if (ci < 0) return "debit";
  if (di < 0) return "credit";
  return ci < di ? "credit" : "debit";
}
