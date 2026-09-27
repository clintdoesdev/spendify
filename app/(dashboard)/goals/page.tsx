import { Plus } from "lucide-react";

import { GoalCard } from "@/components/dashboard/GoalCard";
import { Button } from "@/components/ui/button";
import { goals } from "@/lib/mockData";

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Savings Goals</h2>
          <p className="mt-1 text-sm text-muted">
            Track progress toward the things that matter most.
          </p>
        </div>

        <Button className="h-11 rounded-xl bg-accent px-4 text-white hover:bg-accent/90">
          <Plus className="size-4" />
          New Goal
        </Button>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}

        <button
          type="button"
          className="surface-card flex min-h-[365px] flex-col items-center justify-center border-dashed text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="mb-3 size-8" />
          <span className="text-sm font-medium">Add a new goal</span>
        </button>
      </section>
    </div>
  );
}
