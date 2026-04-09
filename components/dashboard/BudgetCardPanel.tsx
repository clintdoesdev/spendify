"use client";

import { useEffect, useState } from "react";

import { categoryIconMap } from "@/components/dashboard/iconMap";
import { Badge } from "@/components/ui/badge";
import type { Budget } from "@/lib/mockData";
import { formatCurrency } from "@/lib/mockData";

import { Sparkline } from "./Sparkline";

export function BudgetCardPanel({ budget }: { budget: Budget }) {
  const [width, setWidth] = useState(0);
  const Icon = categoryIconMap[budget.category];
  const percentage = Math.round((budget.spent / budget.limit) * 100);

  useEffect(() => {
    const timeout = window.setTimeout(() => setWidth(Math.min(percentage, 100)), 120);
    return () => window.clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: `${budget.color}22`, color: budget.color }}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text">{budget.category}</h3>
            <p className="text-xs text-muted">{formatCurrency(budget.limit)} limit</p>
          </div>
        </div>
        <Badge
          className={
            budget.status === "Over budget"
              ? "rounded-full border-0 bg-danger/10 px-2 py-1 text-danger"
              : "rounded-full border-0 bg-accent2/10 px-2 py-1 text-accent2"
          }
        >
          {budget.status}
        </Badge>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: budget.color }}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted">
          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
        </p>
        <p className="font-display text-3xl font-bold text-text">{percentage}%</p>
      </div>

      <div className="mt-4">
        <Sparkline data={budget.trend} color={budget.color} />
      </div>
    </div>
  );
}
