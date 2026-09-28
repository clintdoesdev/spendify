"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { deleteBudgetAction, saveBudgetAction } from "@/app/actions";
import { Card, Container, Eyebrow, Notice, PageHeading, PillButton, SelectField, TextField } from "@/components/ui/kit";
import type { Budget, Workspace } from "@/lib/data/types";
import { analyze, lastMonths, monthLabel, spendingByCategory } from "@/lib/finance/analyze";
import { SPEND_CATEGORIES, type SpendCategory } from "@/lib/finance/categorize";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BudgetsView({ workspace }: { workspace: Workspace }) {
  const { accounts, lines, prefs, asOf, mode } = workspace;
  const [budgets, setBudgets] = useState<Budget[]>(workspace.budgets);
  useEffect(() => setBudgets(workspace.budgets), [workspace.budgets]);

  const analysis = useMemo(() => analyze(lines, accounts, prefs), [lines, accounts, prefs]);
  const months = useMemo(() => lastMonths(asOf, 12).reverse(), [asOf]);
  const [month, setMonth] = useState(months[0]);
  const spending = useMemo(() => new Map(spendingByCategory(analysis, month).map((s) => [s.category, s.amount])), [analysis, month]);

  // Typical monthly spend per category over the 3 full months before this one.
  const typical = useMemo(() => {
    const prior = months.slice(1, 4);
    const sums = new Map<SpendCategory, number>();
    for (const m of prior) for (const s of spendingByCategory(analysis, m)) sums.set(s.category, (sums.get(s.category) ?? 0) + s.amount);
    return new Map([...sums].map(([c, v]) => [c, v / prior.length]));
  }, [analysis, months]);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const isCurrent = month === months[0];
  const dayShare = isCurrent ? Number(asOf.slice(8, 10)) / daysIn(asOf) : 1;
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spending.get(b.category) ?? 0), 0);
  const unbudgeted = [...spending].filter(([c]) => !budgets.some((b) => b.category === c)).sort((a, b) => b[1] - a[1]);

  const save = (category: SpendCategory, monthlyLimit: number) => {
    const previous = budgets;
    setBudgets((bs) => {
      const existing = bs.find((b) => b.category === category);
      if (existing) return bs.map((b) => (b.category === category ? { ...b, monthlyLimit } : b));
      return [...bs, { id: `local-${category}`, category, monthlyLimit }];
    });
    if (mode !== "live") return;
    startTransition(async () => {
      const result = await saveBudgetAction({ category, monthlyLimit });
      if (!result.ok) {
        setBudgets(previous);
        setError(result.error);
      } else setError(null);
    });
  };

  const remove = (budget: Budget) => {
    const previous = budgets;
    setBudgets((bs) => bs.filter((b) => b.id !== budget.id));
    if (mode !== "live") return;
    startTransition(async () => {
      const result = await deleteBudgetAction(budget.id);
      if (!result.ok) {
        setBudgets(previous);
        setError(result.error);
      }
    });
  };

  return (
    <Container>
      <PageHeading
        eyebrow="Budgets"
        title={
          totalLimit === 0
            ? "Set a limit for what matters"
            : totalSpent <= totalLimit
              ? `${formatNairaCompact(totalLimit - totalSpent)} left to spend`
              : `${formatNairaCompact(totalSpent - totalLimit)} over budget`
        }
        description={
          totalLimit > 0 ? (
            <>
              {formatNaira(totalSpent)} of {formatNaira(totalLimit)} used in {monthLabel(month, true)}
              {isCurrent && `, with ${daysIn(asOf) - Number(asOf.slice(8, 10))} days to go`}.
            </>
          ) : (
            "Budgets use your real spending, so transfers between your banks and money you save never eat into them."
          )
        }
        action={
          <SelectField label="Month" hideLabel className="w-full sm:w-56" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, true)}
              </option>
            ))}
          </SelectField>
        }
      />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {mode === "demo" && budgets !== workspace.budgets && (
        <Notice className="mb-4">Demo mode: changes stay in this tab and aren&apos;t saved.</Notice>
      )}

      {totalLimit > 0 && (
        <div className="mb-8">
          <Meter spent={totalSpent} limit={totalLimit} pace={dayShare} large />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            spent={spending.get(budget.category) ?? 0}
            typical={typical.get(budget.category)}
            pace={dayShare}
            onSave={(limit) => save(budget.category, limit)}
            onDelete={() => remove(budget)}
            disabled={pending}
          />
        ))}

        {adding ? (
          <AddBudget
            available={SPEND_CATEGORIES.filter((c) => c !== "Savings & investments" && !budgets.some((b) => b.category === c))}
            typical={typical}
            onCancel={() => setAdding(false)}
            onSave={(category, limit) => {
              save(category, limit);
              setAdding(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-pebble/70 text-[16px] text-ink-soft transition-colors hover:border-brand hover:text-brand sm:rounded-[36px]"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-cloud">
              <Plus className="size-5" />
            </span>
            Add a budget
          </button>
        )}
      </div>

      {unbudgeted.length > 0 && (
        <section className="mt-14">
          <Eyebrow>Without a budget</Eyebrow>
          <h2 className="mt-3 text-[26px] font-bold tracking-[-0.01em]">Other spending in {monthLabel(month, true)}</h2>
          <ul className="mt-6 divide-y divide-hairline rounded-[28px] bg-cloud px-6 sm:px-8">
            {unbudgeted.map(([category, amount]) => (
              <li key={category} className="flex items-center justify-between gap-4 py-4">
                <span className="text-[16px] text-ink">{category}</span>
                <span className="flex items-center gap-4">
                  <span className="text-[16px] font-semibold text-ink tabular-nums">{formatNaira(amount)}</span>
                  {category !== "Savings & investments" && (
                    <PillButton
                      variant="ghost"
                      className="h-9 px-4 text-[14px]"
                      onClick={() => save(category, roundUp(Math.max(amount, typical.get(category) ?? 0)))}
                    >
                      Budget it
                    </PillButton>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}

function BudgetCard({
  budget,
  spent,
  typical,
  pace,
  onSave,
  onDelete,
  disabled,
}: {
  budget: Budget;
  spent: number;
  typical?: number;
  pace: number;
  onSave: (limit: number) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget.monthlyLimit));
  const left = budget.monthlyLimit - spent;

  return (
    <Card as="div" className="flex flex-col" interactive data-reveal>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[18px] font-bold tracking-[-0.01em] text-ink">{budget.category}</p>
          <p className="mt-1 text-[14px] text-ink-faint">{formatNaira(budget.monthlyLimit)} a month</p>
        </div>
        <div className="flex gap-1">
          <IconButton label={`Edit ${budget.category} budget`} onClick={() => setEditing((e) => !e)}>
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </IconButton>
          <IconButton label={`Delete ${budget.category} budget`} onClick={onDelete} disabled={disabled}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>

      {editing ? (
        <form
          className="mt-5 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(value.replace(/[,₦\s]/g, ""));
            if (n > 0) {
              onSave(n);
              setEditing(false);
            }
          }}
        >
          <TextField label="Monthly limit (₦)" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" autoFocus />
          <PillButton type="submit" className="h-12">Save</PillButton>
        </form>
      ) : (
        <>
          <p className={cn("mt-6 text-[32px] leading-none font-bold tracking-[-0.02em] tabular-nums", left < 0 ? "text-loss" : "text-ink")}>
            {formatNairaCompact(Math.abs(left))}
            <span className="ml-2 text-[15px] font-medium tracking-normal text-ink-faint">{left < 0 ? "over" : "left"}</span>
          </p>
          <div className="mt-5">
            <Meter spent={spent} limit={budget.monthlyLimit} pace={pace} />
          </div>
        </>
      )}
      {typical !== undefined && typical > 0 && !editing && (
        <p className="mt-auto pt-4 text-[13px] text-ink-faint">You usually spend {formatNairaCompact(typical)} a month</p>
      )}
    </Card>
  );
}

/** Spend against limit, with a tick showing where you'd be if spending evenly. */
function Meter({ spent, limit, pace, large }: { spent: number; limit: number; pace: number; large?: boolean }) {
  const ratio = limit > 0 ? spent / limit : 0;
  const tone = ratio > 1 ? "bg-loss" : ratio > pace + 0.1 && ratio > 0.8 ? "bg-warn" : "bg-brand";
  return (
    <div>
      <div className={cn("relative w-full overflow-hidden rounded-full bg-hairline", large ? "h-3" : "h-2")}>
        <div className={cn("grow-x h-full rounded-full transition-[width,background-color] duration-700 ease-out", tone)} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
        {pace < 1 && <div className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${pace * 100}%` }} title="Even pace" />}
      </div>
      <div className="mt-2 flex justify-between text-[13px] text-ink-faint tabular-nums">
        <span>
          {formatNairaCompact(spent)} spent · {formatPercent(ratio)}
        </span>
        {pace < 1 && <span>Even pace: {formatPercent(pace)}</span>}
      </div>
    </div>
  );
}

function AddBudget({
  available,
  typical,
  onSave,
  onCancel,
}: {
  available: SpendCategory[];
  typical: Map<SpendCategory, number>;
  onSave: (category: SpendCategory, limit: number) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<SpendCategory>(available[0]);
  const suggestion = typical.get(category);
  const [value, setValue] = useState(suggestion ? String(roundUp(suggestion)) : "");

  return (
    <Card as="div">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(value.replace(/[,₦\s]/g, ""));
          if (category && n > 0) onSave(category, n);
        }}
      >
        <p className="text-[18px] font-bold tracking-[-0.01em]">New budget</p>
        <SelectField
          label="Category"
          value={category}
          onChange={(e) => {
            const next = e.target.value as SpendCategory;
            setCategory(next);
            const t = typical.get(next);
            setValue(t ? String(roundUp(t)) : "");
          }}
        >
          {available.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Monthly limit (₦)"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          hint={suggestion ? `You usually spend ${formatNaira(suggestion)}` : undefined}
        />
        <div className="flex gap-2">
          <PillButton type="submit">Add budget</PillButton>
          <PillButton variant="quiet" onClick={onCancel}>
            Cancel
          </PillButton>
        </div>
      </form>
    </Card>
  );
}

function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-raised hover:text-ink disabled:opacity-40"
      {...rest}
    >
      {children}
    </button>
  );
}

function daysIn(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function roundUp(n: number) {
  return Math.ceil(n / 5000) * 5000;
}
