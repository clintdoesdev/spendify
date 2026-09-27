import { describe, expect, it } from "vitest";

import { analyze, lastMonths, monthlyFlows } from "@/lib/finance/analyze";
import { categorizeDebit } from "@/lib/finance/categorize";
import { summarize, yearRows } from "@/lib/inflow/aggregate";
import { classifyCredits } from "@/lib/inflow/classify";
import type { BankAccount, StatementLine } from "@/lib/inflow/types";

const accounts: BankAccount[] = [
  { id: "gtb", institution: "GTBank", label: "", last4: "" },
  { id: "kuda", institution: "Kuda", label: "", last4: "" },
];

let n = 0;
const line = (p: Partial<StatementLine>): StatementLine => ({
  id: `l${n++}`,
  accountId: "gtb",
  date: "2026-09-10",
  amount: 1000,
  type: "credit",
  narration: "TRF FROM SOMEONE",
  counterparty: "",
  ...p,
});

const settings = { ownNames: ["ADA OBI"], transferWindowDays: 2, countedReasons: [], overrides: {} };

describe("classifyCredits", () => {
  it("pairs a credit with the same amount leaving another own account", () => {
    const debit = line({ accountId: "gtb", type: "debit", amount: 300000, date: "2026-09-26", narration: "NIP TRF TO KUDA" });
    const credit = line({ accountId: "kuda", amount: 300000, date: "2026-09-27", narration: "NIP TRF FROM GTB" });
    const [c] = classifyCredits([debit, credit], accounts, settings);
    expect(c).toMatchObject({ included: false, reason: "self_transfer" });
    expect(c.matchedDebit?.id).toBe(debit.id);
  });

  it("does not pair outside the window, or on the same account", () => {
    const lines = [
      line({ accountId: "gtb", type: "debit", amount: 5000, date: "2026-09-01" }),
      line({ accountId: "kuda", amount: 5000, date: "2026-09-05" }),
      line({ accountId: "kuda", type: "debit", amount: 7000, date: "2026-09-06" }),
      line({ accountId: "kuda", amount: 7000, date: "2026-09-06" }),
    ];
    expect(classifyCredits(lines, accounts, settings).map((c) => c.included)).toEqual([true, true]);
  });

  it("uses each debit only once", () => {
    const lines = [
      line({ accountId: "gtb", type: "debit", amount: 2000 }),
      line({ accountId: "kuda", amount: 2000 }),
      line({ accountId: "kuda", amount: 2000 }),
    ];
    expect(classifyCredits(lines, accounts, settings).map((c) => c.reason ?? null)).toEqual(["self_transfer", null]);
  });

  it("flags money sent in the user's own name from an unlinked bank", () => {
    const [c] = classifyCredits([line({ narration: "NIP TRF FROM ADA OBI/ACCESS" })], accounts, settings);
    expect(c.reason).toBe("unlinked_own_account");
  });

  it.each([
    ["REVERSAL FAILED TRF", "reversal"],
    ["JUMIA ORDER REFUND", "refund"],
    ["FAIRMONEY LOAN DISBURSEMENT", "loan"],
    ["PIGGYVEST WITHDRAWAL", "savings_return"],
  ])("excludes %s as %s", (narration, reason) => {
    expect(classifyCredits([line({ narration })], accounts, settings)[0]).toMatchObject({ included: false, reason });
  });

  it("lets the user count a group or flip one payment", () => {
    const refund = line({ narration: "REFUND" });
    const salary = line({ narration: "SALARY SEP" });
    expect(classifyCredits([refund], accounts, { ...settings, countedReasons: ["refund"] })[0].included).toBe(true);
    const flipped = classifyCredits([refund, salary], accounts, {
      ...settings,
      overrides: { [refund.id]: "include", [salary.id]: "exclude" },
    });
    expect(flipped.map((c) => [c.included, c.overridden])).toEqual([
      [true, true],
      [false, true],
    ]);
  });

  it("detects income sources", () => {
    const credits = classifyCredits(
      [line({ narration: "SALARY SEP" }), line({ narration: "PAYONEER UPWORK" }), line({ narration: "INTEREST ON SAVINGS" }), line({ narration: "BIRTHDAY GIFT" })],
      accounts,
      settings
    );
    expect(credits.map((c) => c.source)).toEqual(["salary", "business", "returns", "family"]);
  });
});

describe("summarize", () => {
  const lines = [
    line({ date: "2025-09-15", amount: 100, narration: "SALARY" }),
    line({ date: "2026-08-15", amount: 200, narration: "SALARY" }),
    line({ date: "2026-09-15", amount: 300, narration: "SALARY" }),
    line({ date: "2026-09-16", amount: 50, narration: "REFUND" }),
  ];
  const credits = classifyCredits(lines, accounts, settings);

  it("totals the last 12 months and compares with the 12 before", () => {
    const s = summarize(credits, accounts, { kind: "trailing", years: 1 }, "2024-10", "2026-09-27");
    expect(s).toMatchObject({ startMonth: "2025-10", endMonth: "2026-09", total: 500, gross: 550, previousTotal: 100 });
    expect(s.excluded.refund).toEqual({ amount: 50, count: 1 });
    expect(s.buckets).toHaveLength(12);
  });

  it("won't compare with a period the statements only partly cover", () => {
    const s = summarize(credits, accounts, { kind: "trailing", years: 1 }, "2025-01", "2026-09-27");
    expect(s.previousTotal).toBeNull();
  });

  it("compares a partial year with the same months last year", () => {
    const [current] = yearRows(credits, "2025-01", {}, "2026-09-27");
    expect(current).toMatchObject({ year: 2026, total: 500, months: 9 });
    expect(current.growth).toBeCloseTo(4); // 500 vs 100
  });
});

describe("spending", () => {
  it.each([
    ["POS PURCHASE SHOPRITE LEKKI", "Food & groceries"],
    ["BOLT RIDE LAGOS", "Transport"],
    ["MTN DATA BUNDLE 25GB", "Data & airtime"],
    ["IKEDC PREPAID TOKEN", "Bills & utilities"],
    ["SMS ALERT CHARGES", "Bank charges"],
    ["PIGGYVEST TARGET SAVINGS", "Savings & investments"],
    ["NIP TRF TO NGOZI O UPKEEP", "Family & giving"],
    ["NIP TRF TO TUNDE A", "Transfers out"],
    ["SOMETHING ELSE", "Other"],
  ])("%s → %s", (narration, category) => expect(categorizeDebit(narration)).toBe(category));

  it("never counts moving money between your own banks, or saving, as spending", () => {
    const lines = [
      line({ accountId: "gtb", type: "debit", amount: 300000, date: "2026-09-26", narration: "NIP TRF TO KUDA" }),
      line({ accountId: "kuda", amount: 300000, date: "2026-09-26", narration: "NIP TRF FROM GTB" }),
      line({ accountId: "gtb", type: "debit", amount: 5000, narration: "NIP TRF TO ADA OBI/ACCESS" }),
      line({ accountId: "gtb", type: "debit", amount: 40000, narration: "PIGGYVEST TARGET SAVINGS" }),
      line({ accountId: "kuda", type: "debit", amount: 8000, narration: "BOLT RIDE" }),
    ];
    const analysis = analyze(lines, accounts, { ownNames: ["ADA OBI"], countedReasons: [], overrides: {} });
    expect(analysis.debits.map((d) => [d.selfTransfer, d.isSpending])).toEqual([
      [true, false],
      [true, false],
      [false, false],
      [false, true],
    ]);
    const [flow] = monthlyFlows(analysis, ["2026-09"]);
    expect(flow).toMatchObject({ received: 0, spent: 8000 });
  });

  it("lists the months ending with today", () => {
    expect(lastMonths("2026-02-10", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});
