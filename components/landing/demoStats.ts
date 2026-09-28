import { demoWorkspace } from "@/lib/data/demo";
import { analyze } from "@/lib/finance/analyze";
import { summarize } from "@/lib/inflow/aggregate";

/**
 * Real numbers for the landing page, computed once from the demo statements by the same
 * engine the app uses, so every figure on the page is one a visitor can reproduce in the demo.
 */
function compute() {
  const ws = demoWorkspace({ canSignUp: false });
  const analysis = analyze(ws.lines, ws.accounts, ws.prefs);
  const earliest = ws.lines[0].date.slice(0, 7);
  const year = summarize(analysis.credits, ws.accounts, { kind: "trailing", years: 1 }, earliest, ws.asOf);

  const inYear = (d: string) => d.slice(0, 7) >= year.startMonth && d.slice(0, 7) <= year.endMonth;
  const pairs = analysis.credits.filter((c) => c.matchedDebit && inYear(c.line.date));
  const example = [...pairs].sort((a, b) => b.line.amount - a.line.amount)[0];
  const accountName = (id: string) => ws.accounts.find((a) => a.id === id)?.institution ?? "";

  const spans = ([1, 2, 3, 5] as const).map((years) => {
    const sum = summarize(analysis.credits, ws.accounts, { kind: "trailing", years }, earliest, ws.asOf);
    return {
      years,
      total: sum.total,
      gross: sum.gross,
      ownMoves: sum.excluded.self_transfer.amount + sum.excluded.unlinked_own_account.amount,
      savings: sum.excluded.savings_return.amount,
      bounced: sum.excluded.reversal.amount + sum.excluded.refund.amount + sum.excluded.loan.amount,
      transfers: sum.excluded.self_transfer.count + sum.excluded.unlinked_own_account.count,
    };
  });

  return {
    spans,
    accounts: ws.accounts,
    total: year.total,
    gross: year.gross,
    previousTotal: year.previousTotal,
    excluded: year.excluded,
    bySource: year.bySource,
    monthly: year.buckets.map((b) => ({ label: b.label, total: b.total })),
    matchedTransfers: pairs.length,
    example: example && {
      amount: example.line.amount,
      date: example.line.date,
      from: accountName(example.matchedDebit!.accountId),
      to: accountName(example.line.accountId),
      narration: example.line.narration,
    },
  };
}

let cached: ReturnType<typeof compute> | null = null;
export function demoStats() {
  cached ??= compute();
  return cached;
}
