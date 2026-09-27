import {
  AS_OF,
  OWN_NAMES,
  bankAccounts,
  statementLines,
} from "@/lib/inflow/mockStatements";

import type { Workspace } from "./types";

export function demoWorkspace(): Workspace {
  return {
    mode: "demo",
    viewer: { email: "demo@spendify.app", initials: "CK" },
    asOf: AS_OF,
    accounts: bankAccounts,
    lines: statementLines,
    prefs: { ownNames: OWN_NAMES, countedReasons: [], overrides: {} },
    budgets: [
      { id: "b-food", category: "Food & groceries", monthlyLimit: 260_000 },
      { id: "b-transport", category: "Transport", monthlyLimit: 110_000 },
      { id: "b-data", category: "Data & airtime", monthlyLimit: 45_000 },
      { id: "b-bills", category: "Bills & utilities", monthlyLimit: 110_000 },
      { id: "b-family", category: "Family & giving", monthlyLimit: 220_000 },
      { id: "b-fun", category: "Entertainment", monthlyLimit: 15_000 },
    ],
    goals: [
      { id: "g-rent", name: "Next year's rent", target: 1_900_000, saved: 1_150_000, deadline: "2027-02-28" },
      { id: "g-emergency", name: "Emergency fund", target: 3_000_000, saved: 1_320_000, deadline: null },
      { id: "g-laptop", name: "New laptop", target: 1_600_000, saved: 1_480_000, deadline: "2026-11-30" },
    ],
  };
}
