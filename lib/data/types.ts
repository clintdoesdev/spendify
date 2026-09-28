import type { InflowPrefs } from "@/lib/finance/analyze";
import type { SpendCategory } from "@/lib/finance/categorize";
import type { BankAccount, StatementLine } from "@/lib/inflow/types";

export type Budget = { id: string; category: SpendCategory; monthlyLimit: number };

export type Goal = { id: string; name: string; target: number; saved: number; deadline: string | null };

export type Viewer = { email: string; initials: string };

/** Everything a page needs about the signed-in user (or the demo user). Amounts in naira. */
export type Workspace = {
  mode: "demo" | "live";
  /** Demo only: a database is connected, so the visitor can create a real account. */
  canSignUp: boolean;
  viewer: Viewer;
  /** "Today" for all calculations, YYYY-MM-DD. Fixed in demo mode so sample data stays current. */
  asOf: string;
  accounts: BankAccount[];
  lines: StatementLine[];
  prefs: InflowPrefs;
  budgets: Budget[];
  goals: Goal[];
};
