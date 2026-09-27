"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Link2, Undo2 } from "lucide-react";

import type { InflowSummary, YearRow } from "@/lib/inflow/aggregate";
import {
  EXCLUSION_REASONS,
  INFLOW_SOURCES,
  type BankAccount,
  type ClassifiedCredit,
  type ExclusionReason,
} from "@/lib/inflow/types";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { reasonMeta, sourceMeta } from "./meta";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        checked ? "bg-accent" : "bg-white/8"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("surface-card p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Gross credits → minus each exclusion → True Inflow. */
export function Reconciliation({ summary }: { summary: InflowSummary }) {
  const rows = EXCLUSION_REASONS.filter((r) => summary.excluded[r].amount > 0);
  const scale = summary.gross || 1;

  return (
    <Panel
      title="How we got there"
      subtitle="Every credit on your statements, minus money that was already yours"
      className="h-full"
    >
      <div className="space-y-3">
        <ReconRow label="Gross credits" value={summary.gross} width={1} tone="neutral" />
        {rows.map((reason) => (
          <ReconRow
            key={reason}
            label={reasonMeta[reason].label}
            count={summary.excluded[reason].count}
            value={-summary.excluded[reason].amount}
            width={summary.excluded[reason].amount / scale}
            tone="muted"
          />
        ))}
        <div className="border-t border-border pt-3">
          <ReconRow label="True Inflow" value={summary.total} width={summary.total / scale} tone="accent" />
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        {formatPercent(1 - summary.total / scale)} of what landed in your accounts wasn&apos;t new
        money. Review anything we got wrong below.
      </p>
    </Panel>
  );
}

function ReconRow({
  label,
  value,
  width,
  tone,
  count,
}: {
  label: string;
  value: number;
  width: number;
  tone: "neutral" | "muted" | "accent";
  count?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={cn("min-w-0 truncate", tone === "accent" ? "font-semibold text-text" : "text-muted")}>
          {label}
          {count !== undefined && <span className="ml-1.5 text-xs text-muted/70">×{count}</span>}
        </span>
        <span
          className={cn(
            "shrink-0 tabular-nums whitespace-nowrap",
            tone === "accent" ? "font-display text-lg font-bold text-text" : "text-text"
          )}
        >
          {value < 0 ? "−" : ""}
          {formatNaira(Math.abs(value))}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/4">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            tone === "accent" ? "bg-accent" : tone === "neutral" ? "bg-soft/50" : "bg-soft/25"
          )}
          style={{ width: `${Math.max(width * 100, 0.8)}%` }}
        />
      </div>
    </div>
  );
}

/** Part-to-whole strip of sources, with a legend that doubles as the key for the main chart. */
export function SourceStrip({ summary }: { summary: InflowSummary }) {
  const parts = INFLOW_SOURCES.filter((s) => summary.bySource[s] > 0);
  const total = summary.total || 1;

  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
        {parts.map((source) => (
          <div
            key={source}
            className="h-full transition-[flex-grow] duration-700 first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: summary.bySource[source], backgroundColor: sourceMeta[source].color }}
            title={`${sourceMeta[source].label}: ${formatNaira(summary.bySource[source])}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {parts.map((source) => (
          <div key={source} className="flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full" style={{ backgroundColor: sourceMeta[source].color }} />
            <span className="text-muted">{sourceMeta[source].short}</span>
            <span className="tabular-nums text-text">{formatPercent(summary.bySource[source] / total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BankBreakdown({ summary }: { summary: InflowSummary }) {
  const max = Math.max(...summary.byAccount.map((a) => a.amount), 1);

  return (
    <Panel title="Where it landed" subtitle="True Inflow by bank account">
      <div className="space-y-4">
        {summary.byAccount.map(({ account, amount }) => (
          <div key={account.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-3">
                <BankMark account={account} />
                <span>
                  <span className="block text-text">{account.institution}</span>
                  <span className="block text-xs text-muted">
                    {account.label} ••{account.last4}
                  </span>
                </span>
              </span>
              <span className="tabular-nums text-text">{formatNairaCompact(amount)}</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/4">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${(amount / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function BankMark({ account, size = "md" }: { account: BankAccount; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-border bg-white/5 font-display font-bold text-text",
        size === "md" ? "size-9 text-xs" : "size-6 rounded-lg text-[10px]"
      )}
    >
      {account.institution.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function TopPayers({ summary }: { summary: InflowSummary }) {
  const total = summary.total || 1;

  return (
    <Panel title="Who paid you" subtitle="Top senders in this period">
      <ol className="space-y-3">
        {summary.topPayers.map((payer, i) => (
          <li key={payer.name} className="flex items-center gap-3">
            <span className="w-4 text-xs tabular-nums text-muted">{i + 1}</span>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: sourceMeta[payer.source].color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text">{payer.name}</span>
              <span className="block text-xs text-muted">
                {sourceMeta[payer.source].short} · {payer.count} payment{payer.count === 1 ? "" : "s"}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-sm tabular-nums text-text">{formatNairaCompact(payer.amount)}</span>
              <span className="block text-xs tabular-nums text-muted">{formatPercent(payer.amount / total)}</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function YearTable({
  rows,
  activeYear,
  onSelect,
}: {
  rows: YearRow[];
  activeYear: number | null;
  onSelect: (year: number) => void;
}) {
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <Panel title="Year by year" subtitle="Tap a year to focus on it. Real growth is after inflation.">
      <div className="-mx-2">
        <div className="grid grid-cols-[3.5rem_1fr_4.5rem_4.5rem] gap-2 px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>Year</span>
          <span>Received</span>
          <span className="text-right">Growth</span>
          <span className="text-right">Real</span>
        </div>
        {rows.map((row) => (
          <button
            key={row.year}
            type="button"
            onClick={() => onSelect(row.year)}
            className={cn(
              "grid w-full grid-cols-[3.5rem_1fr_4.5rem_4.5rem] items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm transition-colors",
              activeYear === row.year ? "bg-accent/12" : "hover:bg-white/4"
            )}
          >
            <span className={cn("font-medium", activeYear === row.year ? "text-accent" : "text-text")}>
              {row.year}
              {row.months < 12 && <span className="block text-[10px] font-normal text-muted">YTD</span>}
            </span>
            <span>
              <span className="block tabular-nums text-text">{formatNairaCompact(row.total)}</span>
              <span className="mt-1 block h-1 rounded-full bg-white/4">
                <span
                  className="block h-full rounded-full bg-accent/70"
                  style={{ width: `${(row.total / max) * 100}%` }}
                />
              </span>
            </span>
            <Delta value={row.growth} />
            <Delta value={row.realGrowth} />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-right text-muted">—</span>;
  return (
    <span className={cn("text-right tabular-nums", value >= 0 ? "text-accent2" : "text-danger")}>
      {value >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(value))}
    </span>
  );
}

const PAGE = 6;

export function ExclusionReview({
  credits,
  accounts,
  countedReasons,
  onToggleReason,
  onToggleCredit,
}: {
  credits: ClassifiedCredit[];
  accounts: BankAccount[];
  countedReasons: ExclusionReason[];
  onToggleReason: (reason: ExclusionReason, counted: boolean) => void;
  onToggleCredit: (credit: ClassifiedCredit) => void;
}) {
  const flagged = useMemo(() => credits.filter((c) => c.reason), [credits]);
  const reasons = EXCLUSION_REASONS.filter((r) => flagged.some((c) => c.reason === r));
  const [active, setActive] = useState<ExclusionReason>(reasons[0] ?? "self_transfer");
  const [limit, setLimit] = useState(PAGE);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const items = flagged.filter((c) => c.reason === active).reverse();
  const counted = countedReasons.includes(active);

  return (
    <Panel
      title="Review what we left out"
      subtitle="You're in control — count a whole group, or flip a single payment."
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {reasons.map((reason) => {
          const group = flagged.filter((c) => c.reason === reason);
          return (
            <button
              key={reason}
              type="button"
              onClick={() => {
                setActive(reason);
                setLimit(PAGE);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
                active === reason
                  ? "border-accent/40 bg-accent/12 text-text"
                  : "border-border text-muted hover:bg-white/4 hover:text-text"
              )}
            >
              {reasonMeta[reason].label}
              <span className="rounded-full bg-white/8 px-1.5 text-xs tabular-nums">{group.length}</span>
            </button>
          );
        })}
      </div>

      <div className="surface-inner mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text">Count {reasonMeta[active].label.toLowerCase()} as income</p>
          <p className="mt-0.5 text-xs text-muted">{reasonMeta[active].hint}</p>
        </div>
        <Switch
          checked={counted}
          onChange={(next) => onToggleReason(active, next)}
          label={`Count ${reasonMeta[active].label} as income`}
        />
      </div>

      {active === "unlinked_own_account" && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-yellow/20 bg-yellow/5 p-3 text-sm text-text">
          <Link2 className="size-4 shrink-0 text-yellow" />
          <span className="flex-1">
            These came from <span className="font-medium">Access Bank</span> in your name. Link it so
            we can match both sides automatically.
          </span>
          <button type="button" className="flex items-center gap-1 text-sm font-medium text-accent">
            Link bank <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      <ul className="mt-3 divide-y divide-border">
        {items.slice(0, limit).map((credit) => {
          const account = accountById.get(credit.line.accountId);
          const from = credit.matchedDebit && accountById.get(credit.matchedDebit.accountId);
          return (
            <li key={credit.line.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:flex-nowrap">
              {account && <BankMark account={account} size="sm" />}
              <div className="min-w-0 flex-1 basis-[calc(100%-2.25rem)] sm:basis-auto">
                <p className="truncate font-mono text-[13px] text-text">{credit.line.narration}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(credit.line.date)} · into {account?.institution}
                  {from && (
                    <>
                      {" "}
                      · matched to {from.institution} debit on {formatDate(credit.matchedDebit!.date)}
                    </>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "ml-9 text-sm tabular-nums sm:ml-0",
                  credit.included ? "text-text" : "text-muted line-through decoration-muted/50"
                )}
              >
                {formatNaira(credit.line.amount)}
              </span>
              <button
                type="button"
                onClick={() => onToggleCredit(credit)}
                className={cn(
                  "ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors sm:ml-0",
                  credit.included
                    ? "border-accent/40 bg-accent/12 text-accent"
                    : "border-border text-muted hover:bg-white/5 hover:text-text"
                )}
              >
                {credit.included ? <Check className="size-3.5" /> : <Undo2 className="size-3.5" />}
                {credit.included ? "Counted" : "Count it"}
              </button>
            </li>
          );
        })}
      </ul>

      {items.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE * 2)}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-accent"
        >
          Show more <ChevronDown className="size-4" />
          <span className="text-muted">({items.length - limit} left)</span>
        </button>
      )}
    </Panel>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
