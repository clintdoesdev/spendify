import { categoryIconMap } from "@/components/dashboard/iconMap";
import type { Transaction } from "@/lib/mockData";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const categoryStyles: Record<Transaction["category"], string> = {
  Income: "bg-accent2/15 text-accent2",
  "Food & Dining": "bg-accent/15 text-accent",
  Transport: "bg-accent2/15 text-accent2",
  Entertainment: "bg-yellow/15 text-yellow",
  Utilities: "bg-danger/15 text-danger",
  Shopping: "bg-orange/15 text-orange",
  Health: "bg-accent2/15 text-accent2",
  Savings: "bg-white/10 text-text",
};

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const Icon = categoryIconMap[transaction.category];
  const positive = transaction.amount > 0;

  return (
    <div className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          categoryStyles[transaction.category]
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{transaction.merchant}</p>
        <p className="text-xs text-muted">{transaction.relativeDate}</p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", positive ? "text-accent2" : "text-danger")}>
          {positive ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount))}
        </p>
        <p className="text-xs text-muted">{transaction.category}</p>
      </div>
    </div>
  );
}
