import { and, asc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "@/lib/db/schema";
import { bankAccounts, budgets, goals, inflowPreferences, statementLines } from "@/lib/db/schema";
import type { InflowPrefs } from "@/lib/finance/analyze";
import type { SpendCategory } from "@/lib/finance/categorize";
import { EXCLUSION_REASONS, type BankAccount, type ExclusionReason, type StatementLine } from "@/lib/inflow/types";

import type { Budget, Goal } from "./types";

// Data access for one user. Every query is scoped by userId: the app connects as the table
// owner, so this filter (not row level security) is what keeps users apart.

export type Db = PostgresJsDatabase<typeof schema>;

const toNaira = (kobo: number) => kobo / 100;
export const toKobo = (naira: number) => Math.round(naira * 100);

export async function listAccounts(db: Db, userId: string): Promise<BankAccount[]> {
  const rows = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.userId, userId))
    .orderBy(asc(bankAccounts.createdAt));
  return rows.map((r) => ({ id: r.id, institution: r.institution, label: r.label, last4: r.last4 }));
}

export async function createAccount(
  db: Db,
  userId: string,
  input: { institution: string; label: string; last4: string }
) {
  const [row] = await db.insert(bankAccounts).values({ userId, ...input }).returning({ id: bankAccounts.id });
  return row.id;
}

export async function deleteAccount(db: Db, userId: string, accountId: string) {
  await db.delete(bankAccounts).where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)));
}

export async function accountBelongsTo(db: Db, userId: string, accountId: string) {
  const rows = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)));
  return rows.length > 0;
}

export async function listLines(db: Db, userId: string): Promise<StatementLine[]> {
  const rows = await db
    .select()
    .from(statementLines)
    .where(eq(statementLines.userId, userId))
    .orderBy(asc(statementLines.date), asc(statementLines.createdAt));
  return rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    date: r.date,
    amount: toNaira(r.amountKobo),
    type: r.type,
    narration: r.narration,
    counterparty: r.counterparty,
  }));
}

export type NewLine = {
  date: string;
  amountKobo: number;
  type: "credit" | "debit";
  narration: string;
  counterparty: string;
  hash: string;
};

/** Inserts lines, silently skipping any already imported (same fingerprint). */
export async function insertLines(
  db: Db,
  userId: string,
  accountId: string,
  source: "csv" | "alert" | "manual",
  lines: NewLine[]
) {
  if (lines.length === 0) return { inserted: 0, skipped: 0 };
  let inserted = 0;
  // Chunk to stay well under Postgres' parameter limit on big statements.
  for (let i = 0; i < lines.length; i += 500) {
    const chunk = lines.slice(i, i + 500);
    const rows = await db
      .insert(statementLines)
      .values(chunk.map((l) => ({ ...l, userId, accountId, source })))
      .onConflictDoNothing({ target: [statementLines.userId, statementLines.hash] })
      .returning({ id: statementLines.id });
    inserted += rows.length;
  }
  return { inserted, skipped: lines.length - inserted };
}

export async function getPrefs(db: Db, userId: string): Promise<InflowPrefs> {
  const [row] = await db.select().from(inflowPreferences).where(eq(inflowPreferences.userId, userId));
  if (!row) return { ownNames: [], countedReasons: [], overrides: {} };
  return {
    ownNames: row.ownNames,
    countedReasons: row.countedReasons.filter((r): r is ExclusionReason =>
      (EXCLUSION_REASONS as readonly string[]).includes(r)
    ),
    overrides: row.overrides,
  };
}

export async function savePrefs(db: Db, userId: string, patch: Partial<InflowPrefs>) {
  const current = await getPrefs(db, userId);
  const next = { ...current, ...patch };
  await db
    .insert(inflowPreferences)
    .values({ userId, ...next })
    .onConflictDoUpdate({
      target: inflowPreferences.userId,
      set: { ...next, updatedAt: sql`now()` },
    });
  return next;
}

export async function listBudgets(db: Db, userId: string): Promise<Budget[]> {
  const rows = await db.select().from(budgets).where(eq(budgets.userId, userId)).orderBy(asc(budgets.category));
  return rows.map((r) => ({
    id: r.id,
    category: r.category as SpendCategory,
    monthlyLimit: toNaira(r.monthlyLimitKobo),
  }));
}

export async function upsertBudget(db: Db, userId: string, category: SpendCategory, monthlyLimit: number) {
  await db
    .insert(budgets)
    .values({ userId, category, monthlyLimitKobo: toKobo(monthlyLimit) })
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.category],
      set: { monthlyLimitKobo: toKobo(monthlyLimit) },
    });
}

export async function deleteBudget(db: Db, userId: string, budgetId: string) {
  await db.delete(budgets).where(and(eq(budgets.userId, userId), eq(budgets.id, budgetId)));
}

export async function listGoals(db: Db, userId: string): Promise<Goal[]> {
  const rows = await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    target: toNaira(r.targetKobo),
    saved: toNaira(r.savedKobo),
    deadline: r.deadline,
  }));
}

export async function createGoal(
  db: Db,
  userId: string,
  input: { name: string; target: number; saved: number; deadline: string | null }
) {
  await db.insert(goals).values({
    userId,
    name: input.name,
    targetKobo: toKobo(input.target),
    savedKobo: toKobo(input.saved),
    deadline: input.deadline,
  });
}

export async function addToGoal(db: Db, userId: string, goalId: string, amount: number) {
  await db
    .update(goals)
    .set({ savedKobo: sql`greatest(0, ${goals.savedKobo} + ${toKobo(amount)})` })
    .where(and(eq(goals.userId, userId), eq(goals.id, goalId)));
}

export async function deleteGoal(db: Db, userId: string, goalId: string) {
  await db.delete(goals).where(and(eq(goals.userId, userId), eq(goals.id, goalId)));
}
