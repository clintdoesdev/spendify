"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import * as repo from "@/lib/data/repo";
import { DemoModeError, requireUserId } from "@/lib/data/workspace";
import { getDb } from "@/lib/db/client";
import { isLiveMode } from "@/lib/env";
import { SPEND_CATEGORIES } from "@/lib/finance/categorize";
import { fingerprintLines } from "@/lib/import/fingerprint";
import { EXCLUSION_REASONS } from "@/lib/inflow/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

async function run<T>(fn: (userId: string) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn(await requireUserId());
  } catch (error) {
    if (error instanceof DemoModeError) return { ok: false, error: "Demo mode: connect a database to save changes." };
    if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const refreshAll = () => revalidatePath("/", "layout");

const money = z.number().finite().positive().max(1e12);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Accounts

const accountInput = z.object({
  institution: z.string().trim().min(1, "Enter the bank name").max(60),
  label: z.string().trim().max(40).default(""),
  last4: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, "Last 4 digits only")
    .default(""),
});

export async function createAccountAction(input: z.input<typeof accountInput>) {
  return run<{ id: string }>(async (userId) => {
    const id = await repo.createAccount(getDb(), userId, accountInput.parse(input));
    refreshAll();
    return { ok: true, data: { id } };
  });
}

export async function deleteAccountAction(accountId: string) {
  return run(async (userId) => {
    await repo.deleteAccount(getDb(), userId, z.string().uuid().parse(accountId));
    refreshAll();
    return { ok: true, message: "Account and its transactions removed" };
  });
}

// Import

const importInput = z.object({
  accountId: z.string().uuid(),
  source: z.enum(["csv", "alert"]),
  lines: z
    .array(
      z.object({
        date: isoDate,
        amount: money,
        type: z.enum(["credit", "debit"]),
        narration: z.string().trim().min(1).max(500),
        counterparty: z.string().trim().max(120),
      })
    )
    .min(1, "Nothing to import")
    .max(20_000, "That's a lot of lines. Split the statement into smaller files."),
});

export async function importLinesAction(input: z.input<typeof importInput>) {
  return run<{ inserted: number; skipped: number }>(async (userId) => {
    const { accountId, source, lines } = importInput.parse(input);
    const db = getDb();
    if (!(await repo.accountBelongsTo(db, userId, accountId))) return { ok: false, error: "Account not found" };
    const result = await repo.insertLines(db, userId, accountId, source, fingerprintLines(accountId, lines));
    refreshAll();
    return { ok: true, data: result };
  });
}

// True Inflow preferences

const prefsInput = z.object({
  ownNames: z.array(z.string().trim().min(2).max(80)).max(10).optional(),
  countedReasons: z.array(z.enum(EXCLUSION_REASONS)).optional(),
  overrides: z.record(z.string(), z.enum(["include", "exclude"])).optional(),
});

export async function savePrefsAction(input: z.input<typeof prefsInput>) {
  return run(async (userId) => {
    const patch = prefsInput.parse(input);
    if (patch.ownNames) patch.ownNames = patch.ownNames.map((n) => n.toUpperCase());
    await repo.savePrefs(getDb(), userId, patch);
    refreshAll();
    return { ok: true };
  });
}

// Budgets

export async function saveBudgetAction(input: { category: string; monthlyLimit: number }) {
  return run(async (userId) => {
    const { category, monthlyLimit } = z
      .object({ category: z.enum(SPEND_CATEGORIES), monthlyLimit: money })
      .parse(input);
    await repo.upsertBudget(getDb(), userId, category, monthlyLimit);
    refreshAll();
    return { ok: true };
  });
}

export async function deleteBudgetAction(budgetId: string) {
  return run(async (userId) => {
    await repo.deleteBudget(getDb(), userId, z.string().uuid().parse(budgetId));
    refreshAll();
    return { ok: true };
  });
}

// Goals

export async function createGoalAction(input: { name: string; target: number; saved: number; deadline: string | null }) {
  return run(async (userId) => {
    const goal = z
      .object({
        name: z.string().trim().min(1, "Name the goal").max(60),
        target: money,
        saved: z.number().finite().min(0).max(1e12),
        deadline: isoDate.nullable(),
      })
      .parse(input);
    await repo.createGoal(getDb(), userId, goal);
    refreshAll();
    return { ok: true };
  });
}

export async function addToGoalAction(goalId: string, amount: number) {
  return run(async (userId) => {
    await repo.addToGoal(
      getDb(),
      userId,
      z.string().uuid().parse(goalId),
      z.number().finite().refine((n) => n !== 0 && Math.abs(n) <= 1e12, "Enter an amount").parse(amount)
    );
    refreshAll();
    return { ok: true };
  });
}

export async function deleteGoalAction(goalId: string) {
  return run(async (userId) => {
    await repo.deleteGoal(getDb(), userId, z.string().uuid().parse(goalId));
    refreshAll();
    return { ok: true };
  });
}

// Session

export async function signOutAction() {
  if (isLiveMode()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
