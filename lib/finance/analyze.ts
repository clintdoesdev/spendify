import { classifyCredits } from "@/lib/inflow/classify";
import type {
  BankAccount,
  ClassifiedCredit,
  ExclusionReason,
  StatementLine,
} from "@/lib/inflow/types";

import { NON_SPEND_CATEGORIES, categorizeDebit, type SpendCategory } from "./categorize";

export type InflowPrefs = {
  ownNames: string[];
  countedReasons: ExclusionReason[];
  overrides: Record<string, "include" | "exclude">;
};

export type ClassifiedDebit = {
  line: StatementLine;
  category: SpendCategory;
  /** Money moved to another of the user's own accounts. Never counts as spending. */
  selfTransfer: boolean;
  /** Real consumption: not a self-transfer and not money parked in savings. */
  isSpending: boolean;
};

export type Analysis = {
  credits: ClassifiedCredit[];
  debits: ClassifiedDebit[];
};

export function analyze(lines: StatementLine[], accounts: BankAccount[], prefs: InflowPrefs): Analysis {
  const credits = classifyCredits(lines, accounts, {
    ownNames: prefs.ownNames,
    transferWindowDays: 2,
    countedReasons: prefs.countedReasons,
    overrides: prefs.overrides,
  });

  const matchedDebits = new Set(credits.flatMap((c) => (c.matchedDebit ? [c.matchedDebit.id] : [])));
  const ownNames = prefs.ownNames.map((n) => n.toUpperCase()).filter(Boolean);
  const ownAccountIds = new Set(accounts.map((a) => a.id));

  const debits = lines
    .filter((line) => line.type === "debit" && ownAccountIds.has(line.accountId))
    .map((line) => {
      const narration = line.narration.toUpperCase();
      const selfTransfer =
        matchedDebits.has(line.id) ||
        (/\bTRF\b|TRANSFER/.test(narration) && ownNames.some((name) => narration.includes(name)));
      const category = categorizeDebit(line.narration);
      return {
        line,
        category,
        selfTransfer,
        isSpending: !selfTransfer && !NON_SPEND_CATEGORIES.includes(category),
      };
    });

  return { credits, debits };
}

export type MonthFlow = { month: string; label: string; received: number; spent: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function monthLabel(month: string, withYear = false) {
  const [y, m] = month.split("-").map(Number);
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
}

/** The `count` calendar months ending with the month of `asOf`, oldest first. */
export function lastMonths(asOf: string, count: number) {
  const [y, m] = asOf.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const index = y * 12 + (m - 1) - (count - 1 - i);
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  });
}

/** True Inflow received vs real spending, per month. */
export function monthlyFlows(analysis: Analysis, months: string[]): MonthFlow[] {
  const received = new Map<string, number>();
  const spent = new Map<string, number>();
  for (const c of analysis.credits) {
    if (c.included) received.set(monthKey(c.line.date), (received.get(monthKey(c.line.date)) ?? 0) + c.line.amount);
  }
  for (const d of analysis.debits) {
    if (d.isSpending) spent.set(monthKey(d.line.date), (spent.get(monthKey(d.line.date)) ?? 0) + d.line.amount);
  }
  return months.map((month) => ({
    month,
    label: monthLabel(month),
    received: received.get(month) ?? 0,
    spent: spent.get(month) ?? 0,
  }));
}

export function spendingByCategory(analysis: Analysis, month: string) {
  const totals = new Map<SpendCategory, number>();
  for (const d of analysis.debits) {
    if (!d.isSpending || monthKey(d.line.date) !== month) continue;
    totals.set(d.category, (totals.get(d.category) ?? 0) + d.line.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
