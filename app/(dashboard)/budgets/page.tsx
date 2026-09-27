import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { BudgetCardPanel } from "@/components/dashboard/BudgetCardPanel";
import { Button } from "@/components/ui/button";
import { budgets } from "@/lib/mockData";

export default function BudgetsPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="surface-inner flex items-center gap-3 self-start px-4 py-2.5 text-sm text-text">
          <button type="button" aria-label="Previous month">
            <ChevronLeft className="size-4 text-muted" />
          </button>
          <span className="font-medium">June 2025</span>
          <button type="button" aria-label="Next month">
            <ChevronRight className="size-4 text-muted" />
          </button>
        </div>

        <Button className="h-11 rounded-xl bg-accent px-4 text-white hover:bg-accent/90">
          <Plus className="size-4" />
          Create Budget
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Total Budgeted</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">₦290,000</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Total Spent</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">₦171,700</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Remaining</p>
          <p className="mt-2 font-display text-3xl font-bold text-accent2">₦118,300</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {budgets.map((budget) => (
          <BudgetCardPanel key={budget.id} budget={budget} />
        ))}
      </section>
    </div>
  );
}
