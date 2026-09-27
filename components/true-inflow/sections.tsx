"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Link2 } from "lucide-react";

import type { InflowSummary, YearRow } from "@/lib/inflow/aggregate";
import {
  EXCLUSION_REASONS,
  INFLOW_SOURCES,
  type BankAccount,
  type ClassifiedCredit,
  type ExclusionReason,
  type InflowSource,
} from "@/lib/inflow/types";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { reasonMeta, sourceLabel } from "./meta";
import { BankAvatar, Card, CardTitle, Eyebrow, PillButton, Switch } from "@/components/ui/kit";

/** Inverted Inkstone panel: gross credits, minus what was already yours, equals True Inflow. */
export function Reconciliation({
  summary,
  onPick,
}: {
  summary: InflowSummary;
  onPick: (reason: ExclusionReason) => void;
}) {
  const gross = summary.gross || 1;
  const filtered = summary.gross - summary.total;
  const reasons = EXCLUSION_REASONS.filter((r) => summary.excluded[r].amount > 0);

  return (
    <section className="flex h-full flex-col rounded-[28px] bg-ink p-6 text-white sm:rounded-[36px] sm:p-8">
      <Eyebrow className="text-ash">How we got there</Eyebrow>
      <p className="mt-3 text-[22px] leading-snug font-bold tracking-[-0.01em] sm:text-[26px]">
        {formatNairaCompact(filtered)} that landed in your accounts was already yours.
      </p>

      <div className="mt-7 space-y-1">
        <ReconRow label="Everything credited" value={summary.gross} ratio={1} tone="gross" />
        {reasons.map((reason) => (
          <ReconRow
            key={reason}
            label={reasonMeta[reason].label}
            count={summary.excluded[reason].count}
            value={-summary.excluded[reason].amount}
            ratio={summary.excluded[reason].amount / gross}
            tone="minus"
            onClick={() => onPick(reason)}
          />
        ))}
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-5">
          <div>
            <p className="text-[14px] text-ash">True Inflow</p>
            <p className="mt-1 text-[30px] leading-none font-extrabold tracking-[-0.025em] tabular-nums sm:text-[36px]">
              {formatNaira(summary.total)}
            </p>
          </div>
          <p className="text-right text-[14px] text-ash tabular-nums">
            {formatPercent(summary.total / gross)}
            <br />
            of credits
          </p>
        </div>
        <div className="mt-4 flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
          <div className="h-full rounded-l-full bg-violet" style={{ flexGrow: summary.total }} />
          <div className="h-full rounded-r-full bg-white/15" style={{ flexGrow: filtered }} />
        </div>
      </div>
    </section>
  );
}

function ReconRow({
  label,
  value,
  ratio,
  tone,
  count,
  onClick,
}: {
  label: string;
  value: number;
  ratio: number;
  tone: "gross" | "minus";
  count?: number;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex items-baseline justify-between gap-3 text-[15px]">
        <span className={cn("min-w-0 truncate", tone === "gross" ? "text-white" : "text-ash")}>
          {label}
          {count !== undefined && <span className="ml-1.5 text-[13px] text-white/40">{count}×</span>}
        </span>
        <span className="shrink-0 text-white tabular-nums">
          {value < 0 ? "− " : ""}
          {formatNaira(Math.abs(value))}
        </span>
      </span>
      <span className="mt-2 block h-1 w-full rounded-full bg-white/8">
        <span
          className={cn("block h-full rounded-full", tone === "gross" ? "bg-white/60" : "bg-white/30")}
          style={{ width: `${Math.max(ratio * 100, 1)}%` }}
        />
      </span>
    </>
  );

  if (!onClick) return <div className="py-2">{content}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-3 block w-[calc(100%+1.5rem)] rounded-2xl px-3 py-2 text-left transition-colors hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
    >
      {content}
    </button>
  );
}

/** Source list that doubles as the chart's emphasis control. */
export function SourceList({
  summary,
  focus,
  onFocus,
}: {
  summary: InflowSummary;
  focus: InflowSource | null;
  onFocus: (source: InflowSource | null) => void;
}) {
  const total = summary.total || 1;
  const max = Math.max(...INFLOW_SOURCES.map((s) => summary.bySource[s]), 1);

  return (
    <Card className="h-full">
      <CardTitle title="Where it came from" subtitle="Tap a source to trace it through the chart." />
      <ul className="mt-6 space-y-1">
        {INFLOW_SOURCES.map((source) => {
          const amount = summary.bySource[source];
          const active = focus === source;
          return (
            <li key={source}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onFocus(active ? null : source)}
                className={cn(
                  "-mx-3 block w-[calc(100%+1.5rem)] rounded-2xl px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
                  active ? "bg-white" : "hover:bg-white/70"
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("text-[16px]", active ? "font-semibold text-violet" : "text-ink")}>
                    {sourceLabel[source]}
                  </span>
                  <span className="flex items-baseline gap-3 tabular-nums">
                    <span className="text-[14px] text-ink-faint">{formatPercent(amount / total)}</span>
                    <span className="w-[72px] text-right text-[16px] font-semibold text-ink">
                      {formatNairaCompact(amount)}
                    </span>
                  </span>
                </span>
                <span className="mt-2.5 block h-1.5 w-full rounded-full bg-hairline">
                  <span
                    className={cn("block h-full rounded-full", active ? "bg-violet" : "bg-ink/80")}
                    style={{ width: `${(amount / max) * 100}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function BankList({ summary }: { summary: InflowSummary }) {
  const total = summary.total || 1;
  return (
    <Card>
      <CardTitle title="Where it landed" subtitle="True Inflow by account" />
      <ul className="mt-6 divide-y divide-hairline">
        {summary.byAccount.map(({ account, amount }) => (
          <li key={account.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
            <BankAvatar account={account} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] text-ink">{account.institution}</span>
              <span className="block text-[14px] text-ink-faint">
                {account.label} ·· {account.last4}
              </span>
            </span>
            <span className="text-right tabular-nums">
              <span className="block text-[16px] font-semibold text-ink">{formatNairaCompact(amount)}</span>
              <span className="block text-[13px] text-ink-faint">{formatPercent(amount / total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PayerList({ summary }: { summary: InflowSummary }) {
  const total = summary.total || 1;
  return (
    <Card>
      <CardTitle title="Who paid you" subtitle="Top senders this period" />
      <ol className="mt-6 divide-y divide-hairline">
        {summary.topPayers.map((payer, i) => (
          <li key={payer.name} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-ink tabular-nums">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] text-ink">{payer.name}</span>
              <span className="block text-[14px] text-ink-faint">
                {sourceLabel[payer.source]} · {payer.count}×
              </span>
            </span>
            <span className="text-right tabular-nums">
              <span className="block text-[16px] font-semibold text-ink">{formatNairaCompact(payer.amount)}</span>
              <span className="block text-[13px] text-ink-faint">{formatPercent(payer.amount / total)}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function YearList({
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
    <Card>
      <CardTitle title="Year by year" subtitle="Real growth is after inflation." />
      <div className="mt-6">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-2 text-[12px] font-medium tracking-[0.075em] text-ink-faint uppercase">
          <span>Year</span>
          <span className="w-14 text-right">Growth</span>
          <span className="w-14 text-right">Real</span>
        </div>
        {rows.map((row) => {
          const active = activeYear === row.year;
          return (
            <button
              key={row.year}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(row.year)}
              className={cn(
                "-mx-3 grid w-[calc(100%+1.5rem)] grid-cols-[1fr_auto_auto] items-center gap-x-4 rounded-2xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
                active ? "bg-white" : "hover:bg-white/70"
              )}
            >
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className={cn("text-[16px] font-semibold", active ? "text-violet" : "text-ink")}>
                    {row.year}
                  </span>
                  <span className="text-[15px] text-ink tabular-nums">{formatNairaCompact(row.total)}</span>
                  {row.months < 12 && <span className="text-[12px] text-ink-faint">to date</span>}
                </span>
                <span className="mt-1.5 block h-1 rounded-full bg-hairline">
                  <span
                    className={cn("block h-full rounded-full", active ? "bg-violet" : "bg-ink/70")}
                    style={{ width: `${(row.total / max) * 100}%` }}
                  />
                </span>
              </span>
              <Growth value={row.growth} />
              <Growth value={row.realGrowth} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Growth({ value }: { value: number | null }) {
  if (value === null) return <span className="w-14 text-right text-ink-faint">—</span>;
  return (
    <span className={cn("w-14 text-right text-[14px] font-semibold tabular-nums", value >= 0 ? "text-gain" : "text-loss")}>
      {value >= 0 ? "+" : "−"}
      {formatPercent(Math.abs(value))}
    </span>
  );
}

const PAGE = 5;

/** Accordion of exclusion groups, each with a group switch and per-payment overrides. */
export function ReviewList({
  credits,
  accounts,
  countedReasons,
  open,
  onOpen,
  onToggleReason,
  onToggleCredit,
}: {
  credits: ClassifiedCredit[];
  accounts: BankAccount[];
  countedReasons: ExclusionReason[];
  open: ExclusionReason | null;
  onOpen: (reason: ExclusionReason | null) => void;
  onToggleReason: (reason: ExclusionReason, counted: boolean) => void;
  onToggleCredit: (credit: ClassifiedCredit) => void;
}) {
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const groups = useMemo(
    () =>
      EXCLUSION_REASONS.map((reason) => {
        const items = credits.filter((c) => c.reason === reason).reverse();
        return { reason, items, amount: items.reduce((sum, c) => sum + c.line.amount, 0) };
      }).filter((g) => g.items.length > 0),
    [credits]
  );
  const [limit, setLimit] = useState(PAGE);

  return (
    <div className="space-y-3">
      {groups.map(({ reason, items, amount }) => {
        const expanded = open === reason;
        const counted = countedReasons.includes(reason);
        const flipped = items.filter((c) => c.overridden).length;

        return (
          <div key={reason} id={`review-${reason}`} className="scroll-mt-28 rounded-2xl bg-cloud">
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => {
                  onOpen(expanded ? null : reason);
                  setLimit(PAGE);
                }}
                className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] text-ink">
                    {reasonMeta[reason].label}
                    <span className="ml-2 text-[14px] text-ink-faint tabular-nums">{items.length}</span>
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-soft">{reasonMeta[reason].hint}</span>
                </span>
                <span className="hidden text-right tabular-nums sm:block">
                  <span className="block text-[16px] font-semibold text-ink">{formatNairaCompact(amount)}</span>
                  <span className="block text-[13px] text-ink-faint">
                    {counted ? "counted" : "left out"}
                    {flipped > 0 && ` · ${flipped} changed`}
                  </span>
                </span>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-ink transition-transform", expanded && "rotate-180")}
                />
              </button>
              <Switch
                checked={counted}
                onChange={(next) => onToggleReason(reason, next)}
                label={`Count ${reasonMeta[reason].label.toLowerCase()} as income`}
              />
            </div>

            {expanded && (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                {reason === "unlinked_own_account" && (
                  <div className="mb-3 flex flex-col gap-3 rounded-2xl bg-violet-wash p-4 sm:flex-row sm:items-center">
                    <Link2 className="size-5 shrink-0 text-violet" />
                    <p className="flex-1 text-[15px] text-ink">
                      {unlinkedBanks(items).length > 0 ? (
                        <>
                          These came from{" "}
                          <span className="font-semibold">{unlinkedBanks(items).join(", ")}</span> in your name.
                        </>
                      ) : (
                        "These came from a bank you haven't added, in your name."
                      )}{" "}
                      Add it and import its statement so we can match both sides.
                    </p>
                    <Link
                      href="/accounts"
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-violet px-5 text-[15px] font-medium text-violet hover:bg-violet-wash"
                    >
                      Add bank <ArrowRight className="size-4" />
                    </Link>
                  </div>
                )}
                <ul className="divide-y divide-hairline rounded-2xl bg-white">
                  {items.slice(0, limit).map((credit) => {
                    const account = accountById.get(credit.line.accountId);
                    const from = credit.matchedDebit && accountById.get(credit.matchedDebit.accountId);
                    return (
                      <li key={credit.line.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:flex-nowrap">
                        {account && <BankAvatar account={account} size={32} />}
                        <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
                          <p className="truncate font-mono text-[13px] tracking-tight text-ink">
                            {credit.line.narration}
                          </p>
                          <p className="mt-1 text-[14px] text-ink-faint">
                            {formatDate(credit.line.date)} · into {account?.institution}
                            {from && ` · paired with ${from.institution}, ${formatDate(credit.matchedDebit!.date)}`}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-12 text-[16px] font-semibold tabular-nums sm:ml-0",
                            credit.included ? "text-ink" : "text-ink-faint line-through decoration-ash"
                          )}
                        >
                          {formatNaira(credit.line.amount)}
                        </span>
                        <PillButton
                          variant={credit.included ? "primary" : "ghost"}
                          className="ml-auto h-9 w-[112px] px-4 text-[14px] sm:ml-0"
                          aria-pressed={credit.included}
                          onClick={() => onToggleCredit(credit)}
                        >
                          {credit.included ? (
                            <>
                              <Check className="size-4" strokeWidth={2.5} /> Counted
                            </>
                          ) : (
                            "Count it"
                          )}
                        </PillButton>
                      </li>
                    );
                  })}
                </ul>
                {items.length > limit && (
                  <button
                    type="button"
                    onClick={() => setLimit((l) => l + PAGE * 3)}
                    className="mt-3 ml-2 text-[15px] font-medium text-violet underline-offset-4 hover:underline"
                  >
                    Show {Math.min(PAGE * 3, items.length - limit)} more of {items.length - limit}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Bank names from narrations like "NIP TRF FROM ADA OBI/ACCESS BANK". */
function unlinkedBanks(items: ClassifiedCredit[]) {
  const names = new Set<string>();
  for (const c of items) {
    const tail = c.line.narration.split("/").pop()?.trim();
    if (tail && tail !== c.line.narration.trim() && tail.length <= 30) {
      names.add(tail.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase()));
    }
  }
  return [...names].slice(0, 3);
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
