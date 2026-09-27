export type BankAccount = {
  id: string;
  institution: string;
  label: string;
  last4: string;
  openedOn: string;
};

export type StatementLine = {
  id: string;
  accountId: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** Always positive, whole naira. Direction lives in `type`. */
  amount: number;
  type: "credit" | "debit";
  narration: string;
  counterparty: string;
};

/** Where included money came from. Order here is the fixed chart/legend order. */
export const INFLOW_SOURCES = ["salary", "business", "family", "returns", "other"] as const;
export type InflowSource = (typeof INFLOW_SOURCES)[number];

/** Why a credit is left out of True Inflow. */
export const EXCLUSION_REASONS = [
  "self_transfer",
  "unlinked_own_account",
  "savings_return",
  "reversal",
  "refund",
  "loan",
] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export type ClassifiedCredit = {
  line: StatementLine;
  included: boolean;
  source: InflowSource;
  /** Set when the engine (not the user) would exclude this credit. */
  reason?: ExclusionReason;
  /** The debit on another of the user's accounts this credit was paired with. */
  matchedDebit?: StatementLine;
  /** True when the user flipped the engine's decision for this line. */
  overridden: boolean;
};

export type InflowSettings = {
  /** Names the user's own transfers show up under in narrations. */
  ownNames: string[];
  /** Max days between the debit and matching credit of a self-transfer. */
  transferWindowDays: number;
  /** Reasons the user has chosen to count as inflow anyway. */
  countedReasons: ExclusionReason[];
  /** Per-line user decisions that win over every rule. */
  overrides: Record<string, "include" | "exclude">;
};

export type Span =
  | { kind: "trailing"; years: number }
  | { kind: "all" }
  | { kind: "year"; year: number };
