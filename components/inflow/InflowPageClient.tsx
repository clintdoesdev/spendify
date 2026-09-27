"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, ShieldCheck, Sparkles } from "lucide-react";

import { summarize, yearRows } from "@/lib/inflow/aggregate";
import { classifyCredits } from "@/lib/inflow/classify";
import {
  AS_OF,
  OWN_NAMES,
  bankAccounts,
  inflationByYear,
  statementLines,
} from "@/lib/inflow/mockStatements";
import {
  INFLOW_SOURCES,
  type ClassifiedCredit,
  type ExclusionReason,
  type InflowSource,
  type Span,
} from "@/lib/inflow/types";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import {
  BankBreakdown,
  BankMark,
  ExclusionReview,
  Panel,
  Reconciliation,
  SourceStrip,
  TopPayers,
  YearTable,
} from "./InflowPanels";
import { sourceMeta } from "./meta";

const InflowChart = dynamic(() => import("./InflowChart").then((m) => m.InflowChart), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-2xl bg-white/3" />,
});

const SPANS: { id: string; label: string; span: Span }[] = [
  { id: "1y", label: "1Y", span: { kind: "trailing", years: 1 } },
  { id: "2y", label: "2Y", span: { kind: "trailing", years: 2 } },
  { id: "3y", label: "3Y", span: { kind: "trailing", years: 3 } },
  { id: "5y", label: "5Y", span: { kind: "trailing", years: 5 } },
  { id: "all", label: "All", span: { kind: "all" } },
];

const EARLIEST_MONTH = statementLines[0]?.date.slice(0, 7) ?? AS_OF.slice(0, 7);

function spanId(span: Span) {
  if (span.kind === "trailing") return `${span.years}y`;
  if (span.kind === "all") return "all";
  return `year-${span.year}`;
}

export function InflowPageClient() {
  const [span, setSpan] = useState<Span>({ kind: "trailing", years: 1 });
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    () => new Set(bankAccounts.map((a) => a.id))
  );
  const [countedReasons, setCountedReasons] = useState<ExclusionReason[]>([]);
  const [overrides, setOverrides] = useState<Record<string, "include" | "exclude">>({});
  const [mode, setMode] = useState<"breakdown" | "cumulative">("breakdown");
  const [hidden, setHidden] = useState<Set<InflowSource>>(new Set());

  // Classification always sees every linked account, so a transfer from a bank that's
  // filtered out of the view is still recognised as the user's own money.
  const allCredits = useMemo(
    () =>
      classifyCredits(statementLines, bankAccounts, {
        ownNames: OWN_NAMES,
        transferWindowDays: 2,
        countedReasons,
        overrides,
      }),
    [countedReasons, overrides]
  );

  const credits = useMemo(
    () => allCredits.filter((c) => selectedAccounts.has(c.line.accountId)),
    [allCredits, selectedAccounts]
  );
  const summary = useMemo(
    () =>
      summarize(
        credits,
        bankAccounts.filter((a) => selectedAccounts.has(a.id)),
        span,
        EARLIEST_MONTH
      ),
    [credits, selectedAccounts, span]
  );
  const years = useMemo(() => yearRows(credits, EARLIEST_MONTH, inflationByYear), [credits]);

  const delta = summary.previousTotal ? summary.total / summary.previousTotal - 1 : null;
  const overrideCount = allCredits.filter((c) => c.overridden).length;

  const toggleAccount = (id: string) =>
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleCredit = (credit: ClassifiedCredit) =>
    setOverrides((prev) => ({ ...prev, [credit.line.id]: credit.included ? "exclude" : "include" }));

  const toggleReason = (reason: ExclusionReason, counted: boolean) => {
    setCountedReasons((prev) => (counted ? [...prev, reason] : prev.filter((r) => r !== reason)));
    // A group-level decision resets the per-payment flips inside that group.
    setOverrides((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([id]) => allCredits.find((c) => c.line.id === id)?.reason !== reason)
      )
    );
  };

  const exportCsv = () => {
    const [from, to] = [summary.startMonth, summary.endMonth];
    const rows = credits.filter((c) => {
      const m = c.line.date.slice(0, 7);
      return c.included && m >= from && m <= to;
    });
    const accountName = new Map(bankAccounts.map((a) => [a.id, `${a.institution} ••${a.last4}`]));
    const csv = [
      ["Date", "Account", "From", "Source", "Narration", "Amount (NGN)"],
      ...rows.map((c) => [
        c.line.date,
        accountName.get(c.line.accountId) ?? "",
        c.line.counterparty,
        sourceMeta[c.source].label,
        c.line.narration,
        String(c.line.amount),
      ]),
      [],
      ["", "", "", "", "True Inflow", String(summary.total)],
    ]
      .map((r) => r.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `spendify-true-inflow-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Time span"
            className="surface-inner flex items-center gap-1 p-1"
          >
            {SPANS.map((option) => {
              const active = spanId(span) === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSpan(option.span)}
                  className={cn(
                    "h-9 min-w-11 rounded-[9px] px-3 text-sm font-medium transition-all",
                    active
                      ? "bg-accent text-white shadow-[0_6px_18px_rgba(124,111,255,0.35)]"
                      : "text-muted hover:text-text"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {span.kind === "year" && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-accent">
              {summary.label}
            </span>
          )}
        </div>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {bankAccounts.map((account) => {
            const on = selectedAccounts.has(account.id);
            return (
              <button
                key={account.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleAccount(account.id)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-xl border pr-3 pl-1.5 text-sm transition-all",
                  on
                    ? "border-border bg-surface text-text"
                    : "border-dashed border-border bg-transparent text-muted opacity-60"
                )}
              >
                <BankMark account={account} size="sm" />
                {account.institution}
              </button>
            );
          })}
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm text-text transition-colors hover:bg-white/5"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>
      </section>

      {/* Hero + reconciliation */}
      <section className="grid gap-4 xl:grid-cols-5">
        <div className="surface-card relative min-w-0 overflow-hidden p-6 sm:p-8 xl:col-span-3">
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-accent2/8 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="size-3.5" />
                True Inflow
              </span>
              <span className="text-sm text-muted">
                {summary.label} · {monthName(summary.startMonth)} – {monthName(summary.endMonth)}
              </span>
            </div>

            <p className="mt-6 text-sm text-muted">You actually received</p>
            <CountUp
              value={summary.total}
              className="mt-1 block font-display text-4xl font-bold tracking-tight text-text sm:text-6xl"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {delta !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium",
                    delta >= 0 ? "bg-accent2/10 text-accent2" : "bg-danger/10 text-danger"
                  )}
                >
                  {delta >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {formatPercent(Math.abs(delta))}
                </span>
              ) : null}
              <span className="text-muted">
                {delta !== null
                  ? `vs ${formatNairaCompact(summary.previousTotal!)} ${span.kind === "year" ? "same months last year" : "the period before"}`
                  : "No earlier period to compare yet"}
              </span>
            </div>

            <div className="mt-8">
              <SourceStrip summary={summary} />
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
              <Stat label="Monthly average" value={formatNairaCompact(summary.averagePerMonth)} />
              <Stat
                label={summary.granularity === "month" ? "Best month" : "Best quarter"}
                value={summary.bestBucket ? formatNairaCompact(summary.bestBucket.total) : "—"}
                hint={summary.bestBucket?.fullLabel}
              />
              <Stat
                label="Months with income"
                value={`${summary.activeMonths}/${summary.monthCount}`}
              />
              <Stat
                label="Filtered out"
                value={formatNairaCompact(summary.gross - summary.total)}
                hint={`${formatPercent((summary.gross - summary.total) / (summary.gross || 1))} of credits`}
              />
            </dl>
          </div>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <Reconciliation summary={summary} />
        </div>
      </section>

      {/* Main chart */}
      <Panel
        title="Money received over time"
        subtitle={`${summary.granularity === "month" ? "Monthly" : "Quarterly"} True Inflow, by source`}
        action={
          <div className="surface-inner flex items-center gap-1 p-1 text-sm">
            {(["breakdown", "cumulative"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "h-8 rounded-[8px] px-3 whitespace-nowrap transition-colors",
                  mode === m ? "bg-white/10 text-text" : "text-muted hover:text-text"
                )}
              >
                {m === "breakdown" ? "By source" : "Running total"}
              </button>
            ))}
          </div>
        }
      >
        {mode === "breakdown" ? (
          <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {INFLOW_SOURCES.map((source) => {
              const off = hidden.has(source);
              return (
                <button
                  key={source}
                  type="button"
                  aria-pressed={!off}
                  onClick={() =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (next.has(source)) next.delete(source);
                      else if (next.size < INFLOW_SOURCES.length - 1) next.add(source);
                      return next;
                    })
                  }
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
                    off ? "border-dashed border-border text-muted opacity-60" : "border-border text-text"
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: off ? "transparent" : sourceMeta[source].color, boxShadow: `inset 0 0 0 1.5px ${sourceMeta[source].color}` }}
                  />
                  {sourceMeta[source].label}
                  <span className="tabular-nums text-muted">{formatNairaCompact(summary.bySource[source])}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 text-text">
              <span className="h-0.5 w-4 rounded-full bg-accent" /> {summary.label}
            </span>
            {summary.previousTotal !== null && (
              <span className="flex items-center gap-2 text-muted">
                <span className="h-0.5 w-4 rounded-full bg-soft/60" /> Period before
              </span>
            )}
          </div>
        )}
        <div className="-mx-2">
          <InflowChart
            data={summary.buckets}
            mode={mode}
            hidden={hidden}
            hasPrevious={summary.previousTotal !== null}
          />
        </div>
      </Panel>

      {/* Breakdown row */}
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <BankBreakdown summary={summary} />
        <TopPayers summary={summary} />
        <div className="lg:col-span-2 xl:col-span-1">
          <YearTable
            rows={years}
            activeYear={span.kind === "year" ? span.year : null}
            onSelect={(year) => setSpan({ kind: "year", year })}
          />
        </div>
      </section>

      <ExclusionReview
        credits={allCredits}
        accounts={bankAccounts}
        countedReasons={countedReasons}
        onToggleReason={toggleReason}
        onToggleCredit={toggleCredit}
      />

      <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-muted">
        <ShieldCheck className="size-3.5" />
        Calculated from {statementLines.length.toLocaleString()} statement lines across {bankAccounts.length}{" "}
        linked accounts
        {overrideCount > 0 && ` · ${overrideCount} manual decision${overrideCount === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold tabular-nums text-text">{value}</dd>
      {hint && <dd className="mt-0.5 truncate text-xs text-muted">{hint}</dd>}
    </div>
  );
}

function monthName(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-NG", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Animates between values; respects reduced-motion. */
function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setDisplay(value);
      return;
    }
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - began) / 700, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + (value - start) * eased;
      from.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className} aria-live="polite">
      {formatNaira(display)}
    </span>
  );
}
