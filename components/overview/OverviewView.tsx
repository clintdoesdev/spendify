"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { BankAvatar, Card, CardTitle, Container, Eyebrow, SelectField } from "@/components/ui/kit";
import type { Workspace } from "@/lib/data/types";
import { analyze, lastMonths, monthKey, monthLabel, monthlyFlows, spendingByCategory } from "@/lib/finance/analyze";
import { CountUp } from "@/components/motion/CountUp";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

const FlowChart = dynamic(() => import("@/components/charts/FlowChart").then((m) => m.FlowChart), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-2xl skeleton sm:h-[320px]" />,
});

export function OverviewView({ workspace }: { workspace: Workspace }) {
  if (workspace.accounts.length === 0 || workspace.lines.length === 0) return <Onboarding workspace={workspace} />;
  return <Overview workspace={workspace} />;
}

function Overview({ workspace }: { workspace: Workspace }) {
  const { accounts, lines, prefs, asOf, budgets } = workspace;
  const analysis = useMemo(() => analyze(lines, accounts, prefs), [lines, accounts, prefs]);
  const months = useMemo(() => lastMonths(asOf, 12), [asOf]);
  const flows = useMemo(() => monthlyFlows(analysis, months), [analysis, months]);
  const [month, setMonth] = useState(months[months.length - 1]);

  const flow = flows.find((f) => f.month === month) ?? flows[flows.length - 1];
  const previous = flows[flows.findIndex((f) => f.month === month) - 1];
  const kept = flow.received - flow.spent;
  const keptRate = flow.received > 0 ? kept / flow.received : null;
  const categories = useMemo(() => spendingByCategory(analysis, month), [analysis, month]);
  const shuffled = analysis.debits
    .filter((d) => d.selfTransfer && monthKey(d.line.date) === month)
    .reduce((sum, d) => sum + d.line.amount, 0);
  const yearReceived = flows.reduce((sum, f) => sum + f.received, 0);
  const isCurrent = month === months[months.length - 1];

  const recent = useMemo(
    () =>
      [...lines]
        .filter((l) => monthKey(l.date) === month)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 7),
    [lines, month]
  );
  const debitById = useMemo(() => new Map(analysis.debits.map((d) => [d.line.id, d])), [analysis]);
  const creditById = useMemo(() => new Map(analysis.credits.map((c) => [c.line.id, c])), [analysis]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  return (
    <div>
      {/* Hero */}
      <Container className="pt-10 pb-10 sm:pt-14 sm:pb-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-rise">
            <Eyebrow>Overview</Eyebrow>
          </div>
          <SelectField
            label="Month"
            hideLabel className="w-full sm:w-60"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {[...months].reverse().map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, true)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
        <p className="animate-rise text-[18px] text-ink-soft [animation-delay:60ms]">
          {kept >= 0 ? "You kept" : "You overspent by"} {isCurrent ? "so far this month" : `in ${monthLabel(month, true)}`}
        </p>
        <h1
          className={cn(
            "mt-2 animate-rise text-[clamp(2.75rem,10vw,7rem)] leading-[0.9] font-black tracking-[-0.05em] tabular-nums [animation-delay:120ms]",
            kept >= 0 ? "text-ink" : "text-loss"
          )}
        >
          <CountUp value={Math.abs(kept)} />
        </h1>
        <p className="mt-5 max-w-2xl animate-rise text-[17px] leading-relaxed text-ink-soft [animation-delay:200ms]">
          You received <span className="font-semibold text-ink">{formatNaira(flow.received)}</span> and spent{" "}
          <span className="font-semibold text-ink">{formatNaira(flow.spent)}</span>
          {shuffled > 0 && (
            <>
              . We ignored <span className="font-semibold text-ink">{formatNairaCompact(shuffled)}</span> you moved
              between your own banks
            </>
          )}
          .
        </p>
          </div>
          <KeptRing rate={keptRate} />
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-y-8 border-t border-hairline pt-8 lg:grid-cols-4 [&>*]:min-w-0">
          <Stat label="Received" value={formatNairaCompact(flow.received)} delta={change(flow.received, previous?.received)} />
          <Stat label="Spent" value={formatNairaCompact(flow.spent)} delta={change(flow.spent, previous?.spent)} invert />
          <Stat
            label="Kept"
            value={keptRate === null ? "—" : formatPercent(keptRate)}
            hint="of what you received"
          />
          <Stat label="Top spend" value={categories[0] ? formatNairaCompact(categories[0].amount) : "—"} hint={categories[0]?.category} />
        </dl>
      </Container>

      {/* Year chart */}
      <Container>
        <Card data-reveal>
          <CardTitle
            title="Received vs spent"
            subtitle="The last 12 months. Transfers between your own banks are left out of both."
          />
          <div className="mt-5 flex flex-wrap gap-5 text-[14px] text-ink-soft">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-brand" /> Received
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-pebble" /> Spent
            </span>
          </div>
          <div className="-mx-2 mt-4">
            <FlowChart data={flows} selected={month} onSelect={setMonth} />
          </div>
        </Card>
      </Container>

      <Container className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Where it went */}
        <Card className="lg:col-span-3" data-reveal>
          <CardTitle title="Where it went" subtitle={`Spending in ${monthLabel(month, true)}`} />
          {categories.length === 0 ? (
            <p className="mt-6 text-[15px] text-ink-soft">No spending recorded this month.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {categories.slice(0, 7).map(({ category, amount }, i) => {
                const budget = budgets.find((b) => b.category === category);
                return (
                  <li key={category}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[16px] text-ink">{category}</span>
                      <span className="flex items-baseline gap-3 tabular-nums">
                        <span className="text-[14px] text-ink-faint">{formatPercent(amount / flow.spent)}</span>
                        <span className="w-20 text-right text-[16px] font-semibold text-ink">{formatNairaCompact(amount)}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-hairline">
                      <div
                        className={cn("grow-x h-full rounded-full", i === 0 ? "bg-brand" : "bg-ink/70")}
                        style={{ width: `${(amount / categories[0].amount) * 100}%`, "--i": i } as React.CSSProperties}
                      />
                    </div>
                    {budget && amount > budget.monthlyLimit && (
                      <p className="mt-1.5 text-[13px] text-loss">
                        {formatNairaCompact(amount - budget.monthlyLimit)} over your {formatNairaCompact(budget.monthlyLimit)} budget
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/budgets" className="mt-6 inline-flex items-center gap-1 text-[15px] font-medium text-brand">
            Budgets <ArrowRight className="size-4" />
          </Link>
        </Card>

        {/* True Inflow teaser */}
        <section className="flex flex-col rounded-[24px] bg-forest p-6 text-white sm:rounded-[28px] sm:p-8 lg:col-span-2" data-reveal style={{ "--delay": "120ms" } as React.CSSProperties}>
          <Eyebrow onForest>True Inflow</Eyebrow>
          <p className="mt-3 text-[22px] leading-snug font-bold tracking-[-0.01em] sm:text-[26px]">
            In the last 12 months you actually received
          </p>
          <p className="mt-4 text-[52px] leading-none font-black tracking-[-0.045em] text-lime tabular-nums">
            {formatNairaCompact(yearReceived)}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-forest-soft">
            Across {accounts.length} bank{accounts.length === 1 ? "" : "s"}, not counting transfers between them,
            reversals, refunds, loans or your own savings coming back.
          </p>
          <div className="mt-auto pt-8">
            <Link
              href="/inflow"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-forest transition-colors hover:bg-lime"
            >
              See the breakdown <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      </Container>

      {/* Recent */}
      <Container className="mt-4">
        <Card data-reveal>
          <CardTitle
            title="Recent activity"
            subtitle={monthLabel(month, true)}
            action={
              <Link href="/transactions" className="inline-flex items-center gap-1 text-[15px] font-medium text-brand">
                All transactions <ArrowRight className="size-4" />
              </Link>
            }
          />
          <ul className="mt-6 divide-y divide-hairline">
            {recent.map((line) => {
              const account = accountById.get(line.accountId);
              const debit = debitById.get(line.id);
              const credit = creditById.get(line.id);
              const tag = debit
                ? debit.selfTransfer
                  ? "Between your banks"
                  : debit.category
                : credit?.reason === "self_transfer" || credit?.reason === "unlinked_own_account"
                  ? "Between your banks"
                  : credit?.reason
                    ? "Not counted as income"
                    : "Income";
              return (
                <li key={line.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  {account && <BankAvatar account={account} size={36} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] text-ink">{line.counterparty || line.narration}</p>
                    <p className="truncate text-[14px] text-ink-faint">
                      {formatShortDate(line.date)} · {tag}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[16px] font-semibold tabular-nums",
                      line.type === "credit" ? "text-gain" : "text-ink"
                    )}
                  >
                    {line.type === "credit" ? "+" : "−"}
                    {formatNaira(line.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </Container>
    </div>
  );
}

function change(current: number, previous: number | undefined) {
  return previous ? current / previous - 1 : null;
}

function Stat({
  label,
  value,
  hint,
  delta,
  invert,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  invert?: boolean;
}) {
  const good = delta !== null && delta !== undefined && (invert ? delta <= 0 : delta >= 0);
  return (
    <div className="pr-4 lg:border-l lg:border-hairline lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
      <dt className="text-[14px] text-ink-faint">{label}</dt>
      <dd className="mt-1.5 text-[28px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums sm:text-[32px]">
        {value}
      </dd>
      {delta !== null && delta !== undefined ? (
        <dd className={cn("mt-2 text-[14px] tabular-nums", good ? "text-gain" : "text-loss")}>
          {delta >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(delta))} vs last month
        </dd>
      ) : (
        hint && <dd className="mt-2 truncate text-[14px] text-ink-faint">{hint}</dd>
      )}
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Onboarding({ workspace }: { workspace: Workspace }) {
  const hasAccounts = workspace.accounts.length > 0;
  const steps = [
    {
      done: hasAccounts,
      title: "Add your banks",
      body: "Every account you use: salary bank, wallets, business account. Transfers between them are ignored automatically.",
      href: "/accounts",
      cta: "Add a bank",
    },
    {
      done: workspace.lines.length > 0,
      title: "Import statements",
      body: "Upload a CSV statement or paste your debit and credit alerts. Re-importing never creates duplicates.",
      href: "/import",
      cta: "Import",
    },
    {
      done: false,
      title: "See your True Inflow",
      body: "What you actually received, where it went, and what you kept, across every bank.",
      href: "/inflow",
      cta: "Open True Inflow",
    },
  ];
  const next = steps.findIndex((s) => !s.done);

  return (
    <Container className="pt-10 sm:pt-14">
      <Eyebrow>Welcome</Eyebrow>
      <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.05] font-bold tracking-[-0.025em] sm:text-[48px]">
        Let&apos;s see where your money really goes.
      </h1>
      <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className={cn("rounded-[28px] p-6 sm:p-8", i === next ? "bg-forest text-white" : "bg-cloud")}>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-[15px] font-semibold",
                step.done ? "bg-gain text-white" : i === next ? "bg-lime text-forest" : "bg-raised text-ink"
              )}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <p className="mt-5 text-[20px] font-bold tracking-[-0.01em]">{step.title}</p>
            <p className={cn("mt-2 text-[15px] leading-relaxed", i === next ? "text-forest-soft" : "text-ink-soft")}>{step.body}</p>
            {i === next && (
              <Link
                href={step.href}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-[15px] font-medium text-forest hover:bg-lime-deep"
              >
                {step.cta} <ArrowRight className="size-4" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Container>
  );
}

/** Share of what came in that you kept, drawn as a ring that fills on load. */
function KeptRing({ rate }: { rate: number | null }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const value = rate === null ? 0 : Math.max(0, Math.min(rate, 1));
  return (
    <div className="flex shrink-0 animate-rise items-center gap-5 [animation-delay:260ms] lg:flex-col lg:gap-3">
      <svg viewBox="0 0 128 128" className="size-28 -rotate-90 sm:size-36" aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--sunken)" strokeWidth="14" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] starting:[stroke-dashoffset:var(--full)]"
          style={{ "--full": String(c) } as React.CSSProperties}
        />
      </svg>
      <div className="lg:text-center">
        <p className="text-[32px] leading-none font-black tracking-[-0.04em] tabular-nums">{rate === null ? "—" : formatPercent(Math.max(rate, 0))}</p>
        <p className="mt-1 text-[14px] text-ink-faint">of what came in, kept</p>
      </div>
    </div>
  );
}
