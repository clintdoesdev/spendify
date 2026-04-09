"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/mockData";

type BudgetBarProps = {
  category: string;
  spent: number;
  limit: number;
  colorClass: string;
  showOverBudget?: boolean;
};

export function BudgetBar({
  category,
  spent,
  limit,
  colorClass,
  showOverBudget = false,
}: BudgetBarProps) {
  const [width, setWidth] = useState(0);
  const percentage = Math.round((spent / limit) * 100);

  useEffect(() => {
    const timeout = window.setTimeout(() => setWidth(Math.min(percentage, 100)), 100);
    return () => window.clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-text">{category}</span>
        <span className="text-muted">
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">{percentage}%</span>
        {showOverBudget ? (
          <Badge className="rounded-full border-0 bg-danger/10 px-2 py-1 text-danger">
            Over budget
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
