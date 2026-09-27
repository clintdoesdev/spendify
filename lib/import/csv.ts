import { counterpartyFrom, parseAmount, parseDate } from "./fields";
import type { ParsedLine } from "./types";

/** RFC 4180-style parsing with quoted fields; the delimiter is sniffed from the text. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const sample = clean.split(/\r?\n/).slice(0, 20).join("\n");
  const delimiter = [",", ";", "\t", "|"]
    .map((d) => ({ d, n: sample.split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field.trim());
      // Blank lines are kept (as []) so row numbers in messages match the file.
      rows.push(row.some((cell) => cell !== "") ? row : []);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

export type ColumnMapping = {
  date: number;
  narration: number;
  credit?: number;
  debit?: number;
  amount?: number;
  /** A "Dr/Cr" style column that says which way a single amount column goes. */
  direction?: number;
};

const HEADER_PATTERNS = {
  date: /^(trans(action)?\.?\s*date|txn\s*date|posting\s*date|posted\s*date|value\s*date|date|tran\s*date)$/,
  narration: /^(narration|description|transaction\s*details|details?|remarks?|particulars|memo|narrative)$/,
  credit: /^(credit|credits|credit\s*amount|money\s*in|deposits?|lodgements?|inflow|cr|amount\s*in|paid\s*in)$/,
  debit: /^(debit|debits|debit\s*amount|money\s*out|withdrawals?|outflow|dr|amount\s*out|paid\s*out)$/,
  amount: /^(amount|transaction\s*amount|amount\s*\(ngn\)|amount\s*ngn|amt)$/,
  direction: /^(dr\s*\/\s*cr|cr\s*\/\s*dr|type|transaction\s*type|direction|debit\s*\/\s*credit)$/,
};

function normalize(header: string) {
  return header.toLowerCase().replace(/[₦()]/g, " ").replace(/\s+/g, " ").replace(/\bngn\b/g, "").trim();
}

export function detectMapping(headers: string[]): ColumnMapping | null {
  const find = (pattern: RegExp) => headers.findIndex((h) => pattern.test(normalize(h)));
  // Prefer the transaction date over a value date when a statement has both.
  const txnDate = headers.findIndex((h) => /trans|txn|tran|post/.test(normalize(h)) && /date/.test(normalize(h)));
  const date = txnDate >= 0 ? txnDate : find(HEADER_PATTERNS.date);
  // A free-text reference column is only a fallback for the description.
  const narrationCol = find(HEADER_PATTERNS.narration);
  const narration = narrationCol >= 0 ? narrationCol : find(/^(reference|ref\.?|ref\s*no\.?)$/);
  const credit = find(HEADER_PATTERNS.credit);
  const debit = find(HEADER_PATTERNS.debit);
  const amount = find(HEADER_PATTERNS.amount);
  const direction = find(HEADER_PATTERNS.direction);

  if (date < 0 || narration < 0) return null;
  if (credit >= 0 || debit >= 0) {
    return { date, narration, credit: credit >= 0 ? credit : undefined, debit: debit >= 0 ? debit : undefined };
  }
  if (amount >= 0) return { date, narration, amount, direction: direction >= 0 ? direction : undefined };
  return null;
}

export type CsvParseResult = {
  lines: ParsedLine[];
  skipped: { row: number; reason: string }[];
  headers: string[];
  mapping: ColumnMapping | null;
};

/**
 * Turns a bank statement export into credits and debits. Banks put account details above
 * the table, so the header row is found by scanning the first rows for known column names.
 */
export function parseStatementCsv(text: string, order: "dmy" | "mdy" = "dmy"): CsvParseResult {
  const rows = parseCsv(text);
  let headerIndex = -1;
  let mapping: ColumnMapping | null = null;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    mapping = detectMapping(rows[i]);
    if (mapping) {
      headerIndex = i;
      break;
    }
  }
  if (!mapping) return { lines: [], skipped: [], headers: rows[0] ?? [], mapping: null };

  const lines: ParsedLine[] = [];
  const skipped: CsvParseResult["skipped"] = [];

  rows.slice(headerIndex + 1).forEach((cells, i) => {
    const rowNumber = headerIndex + i + 2;
    if (cells.length === 0) return;
    const date = parseDate(cells[mapping!.date] ?? "", order);
    const narration = (cells[mapping!.narration] ?? "").replace(/\s+/g, " ").trim();
    if (!date) {
      // Opening/closing balance and total rows have no date; they are not transactions.
      if (cells.some((c) => c)) skipped.push({ row: rowNumber, reason: "No transaction date" });
      return;
    }

    let amount: number | null = null;
    let type: ParsedLine["type"] | null = null;
    if (mapping!.amount !== undefined) {
      const value = parseAmount(cells[mapping!.amount] ?? "");
      const dir = (mapping!.direction !== undefined ? cells[mapping!.direction] ?? "" : "").toUpperCase();
      if (value !== null && value !== 0) {
        amount = Math.abs(value);
        if (/^(C|CR|CREDIT)/.test(dir)) type = "credit";
        else if (/^(D|DR|DEBIT)/.test(dir)) type = "debit";
        else type = value < 0 ? "debit" : "credit";
      }
    } else {
      const credit = mapping!.credit !== undefined ? parseAmount(cells[mapping!.credit] ?? "") : null;
      const debit = mapping!.debit !== undefined ? parseAmount(cells[mapping!.debit] ?? "") : null;
      if (credit) {
        amount = Math.abs(credit);
        type = "credit";
      } else if (debit) {
        amount = Math.abs(debit);
        type = "debit";
      }
    }

    if (!amount || !type) {
      skipped.push({ row: rowNumber, reason: "No amount" });
      return;
    }
    lines.push({
      date,
      amount,
      type,
      narration: narration || "(no description)",
      counterparty: counterpartyFrom(narration),
    });
  });

  return { lines, skipped, headers: rows[headerIndex], mapping };
}
