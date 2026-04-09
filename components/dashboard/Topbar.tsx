"use client";

import { Bell, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/goals": "Savings Goals",
};

export function Topbar({ pathname }: { pathname: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
          Spend smarter
        </p>
        <h1 className="mt-2 text-2xl font-bold text-text sm:text-3xl">
          {titles[pathname] ?? "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-text transition-colors hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
        <Button className="h-11 rounded-xl bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90">
          <Plus className="size-4" />
          Add Transaction
        </Button>
      </div>
    </div>
  );
}
