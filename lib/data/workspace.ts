import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/lib/db/client";
import { isLiveMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { demoWorkspace } from "./demo";
import { getPrefs, listAccounts, listBudgets, listGoals, listLines } from "./repo";
import type { Workspace } from "./types";

export function todayInLagos() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in user's id, for server actions. Throws in demo mode or when signed out. */
export async function requireUserId() {
  if (!isLiveMode()) throw new DemoModeError();
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export class DemoModeError extends Error {
  constructor() {
    super("Spendify is running in demo mode, so nothing can be saved. Add the env vars in .env.example.");
  }
}

function initialsFor(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "ME";
}

/** Loads everything the pages need, once per request. */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  if (!isLiveMode()) return demoWorkspace();

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDb();
  const [accounts, lines, prefs, budgets, goals] = await Promise.all([
    listAccounts(db, user.id),
    listLines(db, user.id),
    getPrefs(db, user.id),
    listBudgets(db, user.id),
    listGoals(db, user.id),
  ]);

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  return {
    mode: "live",
    viewer: { email: user.email ?? "", initials: initialsFor(fullName || user.email || "") },
    asOf: todayInLagos(),
    accounts,
    lines,
    prefs,
    budgets,
    goals,
  };
});
