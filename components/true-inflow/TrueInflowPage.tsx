"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";

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
import { formatNaira, formatNairaCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

import { sourceLabel } from "./meta";
import { BankList, PayerList, Reconciliation, ReviewList, SourceList, YearList } from "./sections";
import { BankAvatar, Card, CardTitle, Container, DeltaChip, Eyebrow, PillButton, Segmented } from "./ui";

const InflowBars = dynamic(() => import("./InflowBars").then((m) => m.InflowBars), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-2xl bg-white/60 sm:h-[360px]" />,
});

type SpanId = "1y" | "2y" | "3y" | "5y" | "all";

const SPANS: { value: SpanId; label: string; short: string; span: Span }[] = [
  { value: "1y", label: "1 year", short: "1Y", span: { kind: "trailing", years: 1 } },
  { value: "2y", label: "2 years", short: "2Y", span: { kind: "trailing", years: 2 } },
  { value: "3y", label: "3 years", short: "3Y", span: { kind: "trailing", years: 3 } },
  { value: "5y", label: "5 years", short: "5Y", span: { kind: "trailing", years: 5 } },
  { value: "all", label: "All time", short: "All", span: { kind: "all" } },
];

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/inflow", label: "True Inflow" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
];

const EARLIEST_MONTH = statementLines[0]?.date.slice(0, 7) ?? AS_OF.slice(0, 7);

function spanId(span: Span): SpanId | null {
  if (span.kind === "trailing") return `${span.years}y` as SpanId;
  if (span.kind === "all") return "all";
  return null;
}

export function TrueInflowPage() {
  const [span, setSpan] = useState<Span>({ kind: "trailing", years: 1 });
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    () => new Set(bankAccounts.map((a) => a.id))
  );
  const [countedReasons, setCountedReasons] = useState<ExclusionReason[]>([]);
  const [overrides, setOverrides] = useState<Record<string, "include" | "exclude">>({});
  const [mode, setMode] = useState<"bars" | "running">("bars");
  const [focus, setFocus] = useState<InflowSource | null>(null);
  const [openReason, setOpenReason] = useState<ExclusionReason | null>("self_transfer");

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
  const range = `${monthName(summary.startMonth)} – ${monthName(summary.endMonth)}`;

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
    const accountName = new Map(bankAccounts.map((a) => [a.id, `${a.institution} ${a.last4}`]));
    const csv = [
      ["Date", "Account", "From", "Source", "Narration", "Amount (NGN)"],
      ...rows.map((c) => [
        c.line.date,
        accountName.get(c.line.accountId) ?? "",
        c.line.counterparty,
        sourceLabel[c.source],
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
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-white/90 backdrop-blur-md">
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Spendify home">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet text-[17px] font-bold text-white">
              S
            </span>
            <span className="text-[19px] font-bold tracking-[-0.01em] text-ink">spendify</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/inflow";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-[15px] transition-colors",
                    active ? "bg-cloud text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-soft hover:text-ink lg:hidden"
            >
              <ArrowLeft className="size-4" /> Overview
            </Link>
            <PillButton variant="ghost" className="hidden h-10 px-5 sm:inline-flex" onClick={exportCsv}>
              <Download className="size-4" /> Export
            </PillButton>
            <span className="flex size-10 items-center justify-center rounded-full bg-cloud text-[14px] font-semibold text-ink">
              CK
            </span>
          </div>
        </Container>
      </header>

      <main>
        {/* Hero */}
        <Container className="pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <Eyebrow className="flex items-center gap-2 text-ink">
              <span className="size-2 rounded-full bg-violet" /> True Inflow
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
            {formatNaira(summary.total)}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            {delta !== null && <DeltaChip value={delta} />}
            <p className="text-[16px] text-ink-soft">
              {delta !== null
                ? `vs ${formatNairaCompact(summary.previousTotal!)} ${span.kind === "year" ? "in the same months last year" : "in the period before"}`
                : "Nothing earlier to compare with yet"}
            </p>
            <p className="w-full text-[16px] text-ink-faint sm:w-auto">
              <span className="mr-4 hidden text-ash sm:inline">·</span>
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
                    "flex h-10 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-[15px] transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
                    on ? "border-hairline bg-white text-ink hover:border-ash" : "border-dashed border-ash text-ink-faint"
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
          <Card>
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
                  <Key color="bg-violet">{sourceLabel[focus]}</Key>
                  <Key color="bg-[#d4d4d8]">Everything else</Key>
                </>
              )}
              {mode === "running" && (
                <>
                  <Key color="bg-violet" line>
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
              {overrideCount > 0 && (
                <p className="mt-5 inline-flex h-8 items-center rounded-full bg-violet-wash px-3 text-[14px] text-violet">
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
      </main>

      {/* Closing band */}
      <footer className="bg-ink text-white">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <Eyebrow className="text-ash">Proof of income</Eyebrow>
              <h2 className="mt-3 text-[32px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[40px]">
                Take your {formatNairaCompact(summary.total)} with you.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ash">
                Download every counted payment for {range} as a statement for a landlord, lender or
                embassy.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <PillButton onClick={exportCsv} className="h-12 px-7 text-[16px]">
                <Download className="size-4" /> Download statement
              </PillButton>
              <Link href="/" className="text-[16px] text-white underline underline-offset-4 hover:text-ash">
                Back to overview
              </Link>
            </div>
          </div>
          <p className="mt-14 border-t border-white/15 pt-6 text-[14px] text-ash">
            Calculated from {statementLines.length.toLocaleString("en-NG")} statement lines across{" "}
            {bankAccounts.length} linked accounts. Inflation figures are illustrative.
          </p>
        </Container>
      </footer>
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
        "h-9 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
        active ? "bg-violet text-white" : "bg-white text-ink hover:bg-white/60"
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
