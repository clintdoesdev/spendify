import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/lib/db/client";
import { isLiveMode } from "@/lib/env";
import { getCurrentUser, isDemoVisitor } from "@/lib/auth/session";

import { demoWorkspace } from "./demo";
import { getPrefs, listAccounts, listBudgets, listGoals, listLines } from "./repo";
import type { Workspace } from "./types";

export function todayInLagos() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

/** The signed-in user's id, for server actions. Throws on sample data or when signed out. */
export async function requireUserId() {
  if (!isLiveMode()) throw new DemoModeError();
  const user = await getCurrentUser();
  if (user) return user.id;
  if (await isDemoVisitor()) throw new DemoModeError();
  throw new Error("Not signed in");
}

export class DemoModeError extends Error {
  constructor() {
    super("This is sample data, so nothing is saved. Create an account to use your own.");
  }
}

function initialsFor(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "ME";
}

/** Loads everything the pages need, once per request. */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  if (!isLiveMode()) return demoWorkspace({ canSignUp: false });

  const user = await getCurrentUser();
  if (!user) {
    // Visitors who pressed "Try the demo" on the landing page explore the sample data.
    if (await isDemoVisitor()) return demoWorkspace({ canSignUp: true });
    redirect("/login");
  }

  const db = getDb();
  const [accounts, lines, prefs, budgets, goals] = await Promise.all([
    listAccounts(db, user.id),
    listLines(db, user.id),
    getPrefs(db, user.id),
    listBudgets(db, user.id),
    listGoals(db, user.id),
  ]);

  return {
    mode: "live",
    canSignUp: false,
    viewer: { email: user.email, initials: initialsFor(user.name || user.email) },
    asOf: todayInLagos(),
    accounts,
    lines,
    // Until the user sets their own, the name they signed up with is the best guess for
    // how their self-transfers appear in narrations.
    prefs: { ...prefs, ownNames: prefs.ownNames.length ? prefs.ownNames : user.name ? [user.name.toUpperCase()] : [] },
    budgets,
    goals,
  };
});
