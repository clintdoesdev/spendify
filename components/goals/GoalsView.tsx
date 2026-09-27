"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { addToGoalAction, createGoalAction, deleteGoalAction } from "@/app/actions";
import { Card, Container, Eyebrow, Notice, PageHeading, PillButton, TextField } from "@/components/ui/kit";
import type { Goal, Workspace } from "@/lib/data/types";
import { analyze, lastMonths, monthKey, monthlyFlows } from "@/lib/finance/analyze";
import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function GoalsView({ workspace }: { workspace: Workspace }) {
  const { accounts, lines, prefs, asOf, mode } = workspace;
  const [goals, setGoals] = useState<Goal[]>(workspace.goals);
  useEffect(() => setGoals(workspace.goals), [workspace.goals]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  const analysis = useMemo(() => analyze(lines, accounts, prefs), [lines, accounts, prefs]);
  // What you typically keep each month: the 3 full months before this one.
  const avgKept = useMemo(() => {
    const flows = monthlyFlows(analysis, lastMonths(asOf, 4).slice(0, 3));
    return flows.reduce((s, f) => s + (f.received - f.spent), 0) / flows.length;
  }, [analysis, asOf]);
  const savedInApps = useMemo(() => {
    const months = new Set(lastMonths(asOf, 12));
    return analysis.debits
      .filter((d) => d.category === "Savings & investments" && months.has(monthKey(d.line.date)))
      .reduce((s, d) => s + d.line.amount, 0);
  }, [analysis, asOf]);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const neededMonthly = goals.reduce((s, g) => s + (monthlyNeed(g, asOf) ?? 0), 0);

  const mutate = (optimistic: (gs: Goal[]) => Goal[], action: () => Promise<{ ok: boolean; error?: string }>) => {
    const previous = goals;
    setGoals(optimistic);
    if (mode !== "live") return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setGoals(previous);
        setError(result.error ?? "Could not save");
      } else setError(null);
    });
  };

  return (
    <Container>
      <PageHeading
        eyebrow="Goals"
        title={goals.length ? `${formatNairaCompact(totalSaved)} saved toward ${goals.length} goal${goals.length === 1 ? "" : "s"}` : "What are you saving for?"}
        description={
          goals.length ? (
            <>
              {formatPercent(totalTarget ? totalSaved / totalTarget : 0)} of {formatNaira(totalTarget)}.
              {neededMonthly > 0 && (
                <>
                  {" "}
                  Hitting every deadline takes <span className="font-semibold text-ink">{formatNairaCompact(neededMonthly)} a month</span>;
                  you&apos;ve been keeping about <span className="font-semibold text-ink">{formatNairaCompact(Math.max(avgKept, 0))}</span>.
                </>
              )}
            </>
          ) : (
            "Rent, an emergency fund, a new laptop. Set a target and a date and we'll tell you what it takes each month."
          )
        }
        action={
          !adding && (
            <PillButton onClick={() => setAdding(true)}>
              <Plus className="size-4" /> New goal
            </PillButton>
          )
        }
      />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {mode === "demo" && goals !== workspace.goals && (
        <Notice className="mb-4">Demo mode: changes stay in this tab and aren&apos;t saved.</Notice>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adding && (
          <NewGoal
            onCancel={() => setAdding(false)}
            onSave={(goal) => {
              setAdding(false);
              mutate((gs) => [...gs, { ...goal, id: `local-${Date.now()}` }], () => createGoalAction(goal));
            }}
          />
        )}
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            asOf={asOf}
            avgKept={avgKept}
            disabled={pending}
            onAdd={(amount) =>
              mutate(
                (gs) => gs.map((g) => (g.id === goal.id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)),
                () => addToGoalAction(goal.id, amount)
              )
            }
            onDelete={() => mutate((gs) => gs.filter((g) => g.id !== goal.id), () => deleteGoalAction(goal.id))}
          />
        ))}
      </div>

      {savedInApps > 0 && (
        <section className="mt-14 rounded-[28px] bg-ink p-6 text-white sm:rounded-[36px] sm:p-10">
          <Eyebrow className="text-ash">From your statements</Eyebrow>
          <p className="mt-3 max-w-2xl text-[24px] leading-snug font-bold tracking-[-0.01em] sm:text-[30px]">
            You moved {formatNairaCompact(savedInApps)} into savings apps and ajo in the last 12 months.
          </p>
          <p className="mt-3 max-w-2xl text-[16px] text-ash">
            That money isn&apos;t counted as spending, and when it comes back it isn&apos;t counted as income either.
          </p>
        </section>
      )}
    </Container>
  );
}

function monthsUntil(deadline: string, asOf: string) {
  const [y1, m1] = asOf.split("-").map(Number);
  const [y2, m2] = deadline.split("-").map(Number);
  return Math.max((y2 - y1) * 12 + (m2 - m1), 0);
}

function monthlyNeed(goal: Goal, asOf: string) {
  if (!goal.deadline || goal.saved >= goal.target) return null;
  const months = Math.max(monthsUntil(goal.deadline, asOf), 1);
  return (goal.target - goal.saved) / months;
}

function GoalCard({
  goal,
  asOf,
  avgKept,
  onAdd,
  onDelete,
  disabled,
}: {
  goal: Goal;
  asOf: string;
  avgKept: number;
  onAdd: (amount: number) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [amount, setAmount] = useState("");
  const ratio = goal.target > 0 ? goal.saved / goal.target : 0;
  const done = ratio >= 1;
  const need = monthlyNeed(goal, asOf);
  const overdue = goal.deadline && !done && goal.deadline < asOf;
  const parsed = Number(amount.replace(/[,₦\s]/g, ""));

  return (
    <Card as="div" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold tracking-[-0.01em]">{goal.name}</p>
          <p className="mt-1 text-[14px] text-ink-faint">
            {goal.deadline ? `By ${formatMonth(goal.deadline)}` : "No deadline"} · {formatNaira(goal.target)}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Delete ${goal.name}`}
          onClick={onDelete}
          disabled={disabled}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-white hover:text-ink disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="text-[32px] leading-none font-bold tracking-[-0.02em] tabular-nums">{formatNairaCompact(goal.saved)}</p>
        <p className="text-[15px] font-semibold text-ink-soft tabular-nums">{formatPercent(Math.min(ratio, 1))}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-hairline">
        <div className={cn("h-full rounded-full", done ? "bg-gain" : "bg-violet")} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>

      <p className={cn("mt-3 text-[14px]", done ? "text-gain" : overdue ? "text-loss" : "text-ink-soft")}>
        {done
          ? "Goal reached."
          : overdue
            ? `Deadline passed with ${formatNairaCompact(goal.target - goal.saved)} to go.`
            : need !== null
              ? `${formatNairaCompact(need)} a month to make it${avgKept > 0 && need > avgKept ? ", more than you usually keep" : ""}.`
              : `${formatNairaCompact(goal.target - goal.saved)} to go.`}
      </p>

      <form
        className="mt-auto flex gap-2 pt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (parsed) {
            onAdd(parsed);
            setAmount("");
          }
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Amount to add to {goal.name}</span>
          <input
            inputMode="decimal"
            placeholder="₦ amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block h-11 w-full rounded-full border border-hairline bg-white px-4 text-[15px] placeholder:text-ash focus:border-violet focus:ring-2 focus:ring-violet/20 focus:outline-none"
          />
        </label>
        <PillButton type="submit" className="h-11 px-5" disabled={!parsed || disabled}>
          Add
        </PillButton>
        <PillButton
          variant="quiet"
          className="h-11 px-4"
          disabled={!parsed || disabled}
          onClick={() => {
            onAdd(-Math.abs(parsed));
            setAmount("");
          }}
        >
          Withdraw
        </PillButton>
      </form>
    </Card>
  );
}

function NewGoal({ onSave, onCancel }: { onSave: (goal: Omit<Goal, "id">) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const num = (v: string) => Number(v.replace(/[,₦\s]/g, "")) || 0;

  return (
    <Card as="div">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && num(target) > 0) {
            onSave({ name: name.trim(), target: num(target), saved: num(saved), deadline: deadline || null });
          }
        }}
      >
        <p className="text-[18px] font-bold tracking-[-0.01em]">New goal</p>
        <TextField label="Name" placeholder="Next year's rent" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Target (₦)" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required />
          <TextField label="Saved so far (₦)" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} />
        </div>
        <TextField label="Deadline (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <div className="flex gap-2">
          <PillButton type="submit">Create goal</PillButton>
          <PillButton variant="quiet" onClick={onCancel}>
            Cancel
          </PillButton>
        </div>
      </form>
    </Card>
  );
}

function formatMonth(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });
}
