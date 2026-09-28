"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";

import { savePrefsAction } from "@/app/actions";
import {
  BankAvatar,
  Card,
  CardTitle,
  Container,
  DeltaChip,
  EmptyState,
  Eyebrow,
  Notice,
  PillButton,
  Segmented,
} from "@/components/ui/kit";
import type { Workspace } from "@/lib/data/types";
import { CountUp } from "@/components/motion/CountUp";
import { downloadCsv } from "@/lib/export";
import { inflationByYear } from "@/lib/finance/inflation";
import { summarize, yearRows } from "@/lib/inflow/aggregate";
import { classifyCredits } from "@/lib/inflow/classify";
import {
  INFLOW_SOURCES,
  type ClassifiedCredit,
  type ExclusionReason,
  type InflowSource,
  type Span,
} from "@/lib/inflow/types";
import { formatNairaCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

import { sourceLabel } from "./meta";
import { BankList, PayerList, Reconciliation, ReviewList, SourceList, YearList } from "./sections";

const InflowBars = dynamic(() => import("./InflowBars").then((m) => m.InflowBars), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-2xl skeleton sm:h-[360px]" />,
});

type SpanId = "1y" | "2y" | "3y" | "5y" | "all";

const SPANS: { value: SpanId; label: string; short: string; span: Span }[] = [
  { value: "1y", label: "1 year", short: "1Y", span: { kind: "trailing", years: 1 } },
  { value: "2y", label: "2 years", short: "2Y", span: { kind: "trailing", years: 2 } },
  { value: "3y", label: "3 years", short: "3Y", span: { kind: "trailing", years: 3 } },
  { value: "5y", label: "5 years", short: "5Y", span: { kind: "trailing", years: 5 } },
  { value: "all", label: "All time", short: "All", span: { kind: "all" } },
];

function spanId(span: Span): SpanId | null {
  if (span.kind === "trailing") return `${span.years}y` as SpanId;
  if (span.kind === "all") return "all";
  return null;
}

export function TrueInflowPage({ workspace }: { workspace: Workspace }) {
  if (workspace.lines.length === 0) {
    return (
      <Container className="pt-14">
        <EmptyState
          title="No statements yet"
          body="Import a statement or paste your bank alerts, and True Inflow will show what you actually received across every bank."
          action={
            <Link href="/import" className="inline-flex h-11 items-center rounded-full bg-lime px-6 text-[15px] font-medium text-forest">
              Import a statement
            </Link>
          }
        />
      </Container>
    );
  }
  return <TrueInflow workspace={workspace} />;
}

function TrueInflow({ workspace }: { workspace: Workspace }) {
  const { accounts: bankAccounts, lines: statementLines, asOf, mode: workspaceMode } = workspace;
  const earliestMonth = statementLines[0]?.date.slice(0, 7) ?? asOf.slice(0, 7);
  const [span, setSpan] = useState<Span>({ kind: "trailing", years: 1 });
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    () => new Set(bankAccounts.map((a) => a.id))
  );
  const [countedReasons, setCountedReasons] = useState<ExclusionReason[]>(workspace.prefs.countedReasons);
  const [overrides, setOverrides] = useState(workspace.prefs.overrides);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ownNames = workspace.prefs.ownNames;
  const [mode, setMode] = useState<"bars" | "running">("bars");
  const [focus, setFocus] = useState<InflowSource | null>(null);
  const [openReason, setOpenReason] = useState<ExclusionReason | null>("self_transfer");

  // Classification always sees every linked account, so a transfer from a bank that's
  // filtered out of the view is still recognised as the user's own money.
  const allCredits = useMemo(
    () =>
      classifyCredits(statementLines, bankAccounts, {
        ownNames,
        transferWindowDays: 2,
        countedReasons,
        overrides,
      }),
    [statementLines, bankAccounts, ownNames, countedReasons, overrides]
  );

  // Persist review decisions (live mode), debounced so quick flips send one request.
  const lastSaved = useRef(JSON.stringify([workspace.prefs.countedReasons, workspace.prefs.overrides]));
  useEffect(() => {
    const snapshot = JSON.stringify([countedReasons, overrides]);
    if (workspaceMode !== "live" || snapshot === lastSaved.current) return;
    const timer = window.setTimeout(async () => {
      const result = await savePrefsAction({ countedReasons, overrides });
      if (result.ok) lastSaved.current = snapshot;
      setSaveError(result.ok ? null : result.error);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [countedReasons, overrides, workspaceMode]);
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
        earliestMonth,
        asOf
      ),
    [credits, bankAccounts, selectedAccounts, span, earliestMonth, asOf]
  );
  const years = useMemo(
    () => yearRows(credits, earliestMonth, inflationByYear, asOf),
    [credits, earliestMonth, asOf]
  );
  const reviewCredits = useMemo(
    () =>
      credits.filter((c) => {
        const m = c.line.date.slice(0, 7);
        return m >= summary.startMonth && m <= summary.endMonth;
      }),
    [credits, summary.startMonth, summary.endMonth]
  );

  const delta = summary.previousTotal ? summary.total / summary.previousTotal - 1 : null;
  const overrideCount = allCredits.filter((c) => c.overridden).length;
  const range =
    summary.startMonth === summary.endMonth
      ? monthName(summary.startMonth)
      : `${monthName(summary.startMonth)} – ${monthName(summary.endMonth)}`;

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

  const reviewReason = (reason: ExclusionReason) => {
    setOpenReason(reason);
    requestAnimationFrame(() =>
      document.getElementById(`review-${reason}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const exportCsv = () => {
    const [from, to] = [summary.startMonth, summary.endMonth];
    const rows = credits.filter((c) => {
      const m = c.line.date.slice(0, 7);
      return c.included && m >= from && m <= to;
    });
    const accountName = new Map(bankAccounts.map((a) => [a.id, `${a.institution} ${a.last4}`.trim()]));
    downloadCsv(`spendify-true-inflow-${from}-to-${to}.csv`, [
      ["Date", "Account", "From", "Source", "Narration", "Amount (NGN)"],
      ...rows.map((c) => [
        c.line.date,
        accountName.get(c.line.accountId) ?? "",
        c.line.counterparty,
        sourceLabel[c.source],
        c.line.narration,
        c.line.amount,
      ]),
      [],
      ["", "", "", "", "True Inflow", summary.total],
    ]);
  };

  return (
    <div>
      <div>
        {/* Hero */}
        <Container className="pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <Eyebrow className="flex items-center gap-2 text-ink">
              <span className="size-2 rounded-full bg-brand" /> True Inflow
            </Eyebrow>
            <Segmented
              label="Time span"
              options={SPANS}
              value={spanId(span)}
              onChange={(id) => setSpan(SPANS.find((s) => s.value === id)!.span)}
            />
          </div>

          <p className="mt-8 text-[18px] text-ink-soft sm:mt-10">
            {span.kind === "year" ? `In ${summary.label}, you actually received` : "You actually received"}
          </p>
          <h1 className="mt-2 text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.92] font-black tracking-[-0.045em] text-ink tabular-nums">
            <CountUp value={summary.total} />
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            {delta !== null && <DeltaChip value={delta} />}
            <p className="text-[16px] text-ink-soft">
              {delta !== null
                ? `vs ${formatNairaCompact(summary.previousTotal!)} ${span.kind === "year" ? "in the same months last year" : "in the period before"}`
                : "Nothing earlier to compare with yet"}
            </p>
            <p className="w-full text-[16px] text-ink-faint sm:w-auto">
              <span className="mr-4 hidden text-pebble sm:inline">·</span>
              {range}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-[15px] text-ink-soft">Counting money into</span>
            {bankAccounts.map((account) => {
              const on = selectedAccounts.has(account.id);
              return (
                <button
                  key={account.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAccount(account.id)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-[15px] transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                    on ? "border-hairline bg-raised text-ink hover:border-pebble" : "border-dashed border-pebble text-ink-faint"
                  )}
                >
                  <span className={cn("transition-opacity", !on && "opacity-30 grayscale")}>
                    <BankAvatar account={account} size={30} />
                  </span>
                  {account.institution}
                </button>
              );
            })}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-y-8 [&>*]:min-w-0 border-t border-hairline pt-8 lg:grid-cols-4">
            <Stat label="Monthly average" value={formatNairaCompact(summary.averagePerMonth)} />
            <Stat
              label={summary.granularity === "month" ? "Best month" : "Best quarter"}
              value={summary.bestBucket ? formatNairaCompact(summary.bestBucket.total) : "—"}
              hint={summary.bestBucket?.fullLabel}
            />
            <Stat label="Months with income" value={`${summary.activeMonths} of ${summary.monthCount}`} />
            <Stat
              label="Left out"
              value={formatNairaCompact(summary.gross - summary.total)}
              hint="money that was already yours"
            />
          </dl>
        </Container>

        {/* Chart */}
        <Container>
          <Card data-reveal>
            <CardTitle
              title="Money received over time"
              subtitle={
                mode === "running"
                  ? "Running total against the period before"
                  : `${summary.granularity === "month" ? "Each month" : "Each quarter"}${focus ? `, with ${sourceLabel[focus].toLowerCase()} highlighted` : ""}`
              }
              action={
                <Segmented
                  size="sm"
                  label="Chart view"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "bars", label: "By month" },
                    { value: "running", label: "Running total" },
                  ]}
                />
              }
            />

            {mode === "bars" ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <FocusChip active={focus === null} onClick={() => setFocus(null)}>
                  All sources
                </FocusChip>
                {INFLOW_SOURCES.filter((s) => summary.bySource[s] > 0).map((source) => (
                  <FocusChip key={source} active={focus === source} onClick={() => setFocus(source)}>
                    {sourceLabel[source]}
                  </FocusChip>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-5 text-[14px] text-ink-soft">
              {mode === "bars" && focus && (
                <>
                  <Key color="bg-brand">{sourceLabel[focus]}</Key>
                  <Key color="bg-[#d4d4d8]">Everything else</Key>
                </>
              )}
              {mode === "running" && (
                <>
                  <Key color="bg-brand" line>
                    {summary.label}
                  </Key>
                  {summary.previousTotal !== null && (
                    <Key color="bg-[#a3a3a3]" line>
                      Period before
                    </Key>
                  )}
                </>
              )}
            </div>

            <div className="-mx-2 mt-4">
              <InflowBars
                data={summary.buckets}
                mode={mode}
                focus={focus}
                hasPrevious={summary.previousTotal !== null}
              />
            </div>
          </Card>
        </Container>

        {/* Reconciliation + sources */}
        <Container className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reconciliation summary={summary} onPick={reviewReason} />
          <SourceList
            summary={summary}
            focus={focus}
            onFocus={(source) => {
              setFocus(source);
              setMode("bars");
            }}
          />
        </Container>

        {/* Breakdown */}
        <Container className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BankList summary={summary} />
          <PayerList summary={summary} />
          <div className="md:col-span-2 xl:col-span-1">
            <YearList
              rows={years}
              activeYear={span.kind === "year" ? span.year : null}
              onSelect={(year) => setSpan({ kind: "year", year })}
            />
          </div>
        </Container>

        {/* Review */}
        <Container className="pt-20 pb-20 sm:pt-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Eyebrow>Review</Eyebrow>
              <h2 className="mt-3 text-[32px] leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-[40px]">
                What we left out, and why
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
                Money that was already yours doesn&apos;t count as income. These are the credits we set
                aside for {range}. Every decision can be reversed: switch a whole group on, or count one
                payment at a time.
              </p>
              {saveError && <Notice tone="error" className="mt-5">{saveError}</Notice>}
              {overrideCount > 0 && (
                <p className="mt-5 inline-flex h-8 items-center rounded-full bg-brand-wash px-3 text-[14px] text-brand">
                  {overrideCount} payment{overrideCount === 1 ? "" : "s"} changed by you
                </p>
              )}
            </div>
            <ReviewList
              credits={reviewCredits}
              accounts={bankAccounts}
              countedReasons={countedReasons}
              open={openReason}
              onOpen={setOpenReason}
              onToggleReason={toggleReason}
              onToggleCredit={toggleCredit}
            />
          </div>
        </Container>

        {/* Closing panel */}
        <Container>
          <section className="rounded-[28px] bg-forest px-6 py-12 text-white sm:rounded-[36px] sm:px-12 sm:py-14">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <Eyebrow onForest>Proof of income</Eyebrow>
                <h2 className="mt-4 text-[34px] leading-[0.95] font-black tracking-[-0.04em] text-lime sm:text-[52px]">
                  Take your {formatNairaCompact(summary.total)} with you.
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-forest-soft">
                  Download every counted payment for {range} as a statement for a landlord, lender or
                  embassy.
                </p>
              </div>
              <PillButton onClick={exportCsv} className="h-12 px-7 text-[16px]">
                <Download className="size-4" /> Download statement
              </PillButton>
            </div>
            <p className="mt-12 border-t border-white/15 pt-6 text-[14px] text-forest-soft">
              Calculated from {statementLines.length.toLocaleString("en-NG")} statement lines across{" "}
              {bankAccounts.length} account{bankAccounts.length === 1 ? "" : "s"}. Inflation figures are
              illustrative.
            </p>
          </section>
        </Container>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="pr-4 lg:border-l lg:border-hairline lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
      <dt className="text-[14px] text-ink-faint">{label}</dt>
      <dd className="mt-1.5 text-[28px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums sm:text-[32px]">
        {value}
      </dd>
      {hint && <dd className="mt-2 text-[14px] text-ink-faint">{hint}</dd>}
    </div>
  );
}

function FocusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
        active ? "bg-lime text-forest" : "bg-raised text-ink hover:bg-sunken"
      )}
    >
      {children}
    </button>
  );
}

function Key({ color, line, children }: { color: string; line?: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn(color, line ? "h-[3px] w-4 rounded-full" : "size-2.5 rounded-[3px]")} />
      {children}
    </span>
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
