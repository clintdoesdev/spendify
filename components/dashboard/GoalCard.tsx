"use client";

import { useEffect, useMemo, useState } from "react";

import { goalIconMap } from "@/components/dashboard/iconMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/lib/mockData";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const circumference = 2 * Math.PI * 48;

export function GoalCard({ goal }: { goal: Goal }) {
  const Icon = goalIconMap[goal.icon];
  const [progress, setProgress] = useState(0);
  const percentage = useMemo(
    () => Number(((goal.saved / goal.target) * 100).toFixed(1)),
    [goal.saved, goal.target]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setProgress(percentage), 120);
    return () => window.clearTimeout(timeout);
  }, [percentage]);

  const strokeDashoffset =
    circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="surface-card flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">{goal.name}</h3>
            <p className="text-xs text-muted">Target {formatCurrency(goal.target)}</p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full border-0 px-2 py-1",
            goal.status === "On track"
              ? "bg-accent2/10 text-accent2"
              : "bg-danger/10 text-danger"
          )}
        >
          {goal.status}
        </Badge>
      </div>

      <div className="my-6 flex justify-center">
        <div className="relative flex h-[120px] w-[120px] items-center justify-center">
          <svg className="-rotate-90" width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={goal.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 900ms ease" }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="font-display text-2xl font-bold text-text">{percentage}%</p>
            <p className="text-xs text-muted">saved</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Saved</span>
          <span className="font-medium text-text">{formatCurrency(goal.saved)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Deadline</span>
          <span className="font-medium text-text">{goal.deadline}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Monthly contribution</span>
          <span className="font-medium text-text">
            {formatCurrency(goal.monthlyContribution)}/mo
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="mt-4 h-11 rounded-xl border border-border bg-white/3 text-text hover:bg-white/6"
      >
        Add Funds
      </Button>
    </div>
  );
}
