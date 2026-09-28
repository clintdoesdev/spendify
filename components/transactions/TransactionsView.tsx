"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { sourceLabel, reasonMeta } from "@/components/true-inflow/meta";
import { BankAvatar, Container, EmptyState, PageHeading, PillButton, SelectField } from "@/components/ui/kit";
import type { Workspace } from "@/lib/data/types";
import { downloadCsv } from "@/lib/export";
import { analyze, monthKey, monthLabel } from "@/lib/finance/analyze";
import { SPEND_CATEGORIES } from "@/lib/finance/categorize";
import type { StatementLine } from "@/lib/inflow/types";
import { formatNaira, formatNairaCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

type Direction = "all" | "in" | "out" | "moved";
type Row = { line: StatementLine; tag: string; kind: "income" | "spend" | "moved" | "other" };

const PAGE = 50;

export function TransactionsView({ workspace }: { workspace: Workspace }) {
  const { accounts, lines, prefs } = workspace;
  const analysis = useMemo(() => analyze(lines, accounts, prefs), [lines, accounts, prefs]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const rows = useMemo<Row[]>(() => {
    const credits = new Map(analysis.credits.map((c) => [c.line.id, c]));
    const debits = new Map(analysis.debits.map((d) => [d.line.id, d]));
    return [...lines]
      .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))
      .map((line) => {
        const debit = debits.get(line.id);
        if (debit) {
          if (debit.selfTransfer) return { line, tag: "Between your banks", kind: "moved" };
          return { line, tag: debit.category, kind: debit.isSpending ? "spend" : "other" };
        }
        const credit = credits.get(line.id);
        if (credit?.reason === "self_transfer" || credit?.reason === "unlinked_own_account") {
          return { line, tag: "Between your banks", kind: "moved" };
        }
        if (credit && !credit.included) return { line, tag: reasonMeta[credit.reason!].label, kind: "other" };
        return { line, tag: credit ? sourceLabel[credit.source] : "Income", kind: "income" };
      });
  }, [lines, analysis]);

  const months = useMemo(() => [...new Set(rows.map((r) => monthKey(r.line.date)))], [rows]);
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("all");
  const [direction, setDirection] = useState<Direction>("all");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ line, tag, kind }) => {
      if (account !== "all" && line.accountId !== account) return false;
      if (month !== "all" && monthKey(line.date) !== month) return false;
      if (category !== "all" && tag !== category) return false;
      if (direction === "in" && (line.type !== "credit" || kind === "moved")) return false;
      if (direction === "out" && (line.type !== "debit" || kind === "moved")) return false;
      if (direction === "moved" && kind !== "moved") return false;
      if (q && !`${line.narration} ${line.counterparty} ${tag} ${line.amount}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, account, direction, category, month]);

  const totals = useMemo(() => {
    let received = 0;
    let spent = 0;
    for (const r of filtered) {
      if (r.kind === "income") received += r.line.amount;
      if (r.kind === "spend") spent += r.line.amount;
    }
    return { received, spent };
  }, [filtered]);

  const exportCsv = () =>
    downloadCsv("spendify-transactions.csv", [
      ["Date", "Account", "Type", "Description", "Counterparty", "Category", "Amount (NGN)"],
      ...filtered.map(({ line, tag }) => [
        line.date,
        accountById.get(line.accountId)?.institution ?? "",
        line.type,
        line.narration,
        line.counterparty,
        tag,
        line.type === "credit" ? line.amount : -line.amount,
      ]),
    ]);

  const reset = (fn: () => void) => {
    fn();
    setLimit(PAGE);
  };

  if (lines.length === 0) {
    return (
      <Container>
        <PageHeading eyebrow="Transactions" title="Every line, every bank" />
        <EmptyState
          title="No transactions yet"
          body="Import a CSV statement or paste bank alerts to see them here."
          action={
            <Link href="/import" className="inline-flex h-11 items-center rounded-full bg-lime px-6 text-[15px] font-medium text-forest">
              Import a statement
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeading
        eyebrow="Transactions"
        title="Every line, every bank"
        description="Transfers between your own accounts are marked, so they never count as income or spending."
        action={
          <PillButton variant="ghost" onClick={exportCsv}>
            <Download className="size-4" /> Export {filtered.length.toLocaleString("en-NG")}
          </PillButton>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder="Search name, description or amount"
            className="block h-12 w-full rounded-[12px] border border-pebble/45 bg-raised pr-4 pl-11 text-[16px] text-ink transition-colors placeholder:text-pebble hover:border-pebble focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
          />
        </label>
        <SelectField label="Bank" hideLabel value={account} onChange={(e) => reset(() => setAccount(e.target.value))}>
          <option value="all">All banks</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.institution}
              {a.last4 ? ` ··${a.last4}` : ""}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Direction"
          hideLabel
          value={direction}
          onChange={(e) => reset(() => setDirection(e.target.value as Direction))}
        >
          <option value="all">In and out</option>
          <option value="in">Money in</option>
          <option value="out">Money out</option>
          <option value="moved">Between your banks</option>
        </SelectField>
        <SelectField label="Category" hideLabel value={category} onChange={(e) => reset(() => setCategory(e.target.value))}>
          <option value="all">All categories</option>
          <optgroup label="Income">
            {Object.values(sourceLabel).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Spending">
            {SPEND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>
        </SelectField>
        <SelectField label="Month" hideLabel value={month} onChange={(e) => reset(() => setMonth(e.target.value))}>
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, true)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-ink-soft">
        <span>
          <span className="font-semibold text-ink tabular-nums">{filtered.length.toLocaleString("en-NG")}</span> transactions
        </span>
        <span>
          Income <span className="font-semibold text-gain tabular-nums">{formatNairaCompact(totals.received)}</span>
        </span>
        <span>
          Spending <span className="font-semibold text-ink tabular-nums">{formatNairaCompact(totals.spent)}</span>
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] bg-cloud sm:rounded-[36px]">
        {filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-[16px] text-ink-soft">Nothing matches those filters.</p>
        ) : (
          <ul className="divide-y divide-hairline px-4 sm:px-8">
            {filtered.slice(0, limit).map(({ line, tag, kind }) => {
              const bank = accountById.get(line.accountId);
              return (
                <li key={line.id} className="flex items-center gap-4 py-4">
                  {bank && <BankAvatar account={bank} size={36} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] text-ink">{line.counterparty || line.narration}</p>
                    <p className="truncate font-mono text-[12px] tracking-tight text-ink-faint">{line.narration}</p>
                  </div>
                  <span
                    className={cn(
                      "hidden shrink-0 rounded-full px-3 py-1 text-[13px] md:inline",
                      kind === "moved" ? "bg-brand-wash text-brand" : "bg-raised text-ink-soft"
                    )}
                  >
                    {tag}
                  </span>
                  <span className="hidden w-24 shrink-0 text-right text-[14px] text-ink-faint tabular-nums sm:block">
                    {formatDate(line.date)}
                  </span>
                  <span className="w-[120px] shrink-0 text-right">
                    <span
                      className={cn(
                        "block text-[16px] font-semibold tabular-nums",
                        line.type === "credit" ? (kind === "income" ? "text-gain" : "text-ink-soft") : "text-ink"
                      )}
                    >
                      {line.type === "credit" ? "+" : "−"}
                      {formatNaira(line.amount)}
                    </span>
                    <span className="block text-[12px] text-ink-faint sm:hidden">{formatDate(line.date)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {filtered.length > limit && (
        <div className="mt-6 flex justify-center">
          <PillButton variant="quiet" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more ({(filtered.length - limit).toLocaleString("en-NG")} left)
          </PillButton>
        </div>
      )}
    </Container>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}
