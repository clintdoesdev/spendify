"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative";
  icon: LucideIcon;
  index: number;
};

export function StatCard({
  label,
  value,
  trend,
  trendTone,
  icon: Icon,
  index,
}: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      className={cn(
        "surface-card p-6 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{label}</span>
        <Icon className="size-4 text-text" />
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-text">{value}</p>
      <span
        className={cn(
          "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium",
          trendTone === "positive"
            ? "bg-accent2/10 text-accent2"
            : "bg-danger/10 text-danger"
        )}
      >
        {trend}
      </span>
    </div>
  );
}
