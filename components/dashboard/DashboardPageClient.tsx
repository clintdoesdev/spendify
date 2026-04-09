"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { BudgetBar } from "@/components/dashboard/BudgetBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { dashboardIconMap } from "@/components/dashboard/iconMap";
import {
  categoryBreakdown,
  monthlyOverview,
  summaryStats,
  transactions,
} from "@/lib/mockData";

const OverviewChart = dynamic(
  () => import("@/components/dashboard/OverviewChart").then((mod) => mod.OverviewChart),
  { ssr: false }
);

const CategoryBreakdownChart = dynamic(
  () =>
    import("@/components/dashboard/CategoryBreakdownChart").then(
      (mod) => mod.CategoryBreakdownChart
    ),
  { ssr: false }
);

export function DashboardPageClient() {
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat, index) => {
          const Icon = dashboardIconMap[stat.icon];

          return (
            <StatCard
              key={stat.id}
              index={index}
              icon={Icon}
              label={stat.label}
              trend={stat.trend}
              trendTone={stat.trendTone}
              value={stat.value}
            />
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="surface-card xl:col-span-3">
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h2 className="text-xl font-semibold text-text">Spending Overview</h2>
              <p className="mt-1 text-sm text-muted">Income and expenses across the year</p>
            </div>
            <div className="surface-inner flex items-center gap-1 p-1 text-xs text-muted">
              <button type="button" className="rounded-full bg-accent px-3 py-1 text-white">
                6M
              </button>
              <button type="button" className="rounded-full px-3 py-1">
                1Y
              </button>
            </div>
          </div>
          <div className="px-2 pb-4">
            <OverviewChart data={monthlyOverview} />
          </div>
        </div>

        <div className="surface-card xl:col-span-2">
          <div className="px-6 pt-6">
            <h2 className="text-xl font-semibold text-text">By Category</h2>
            <p className="mt-1 text-sm text-muted">Where your money is going</p>
          </div>
          <div className="px-2">
            <CategoryBreakdownChart data={categoryBreakdown} />
          </div>
          <div className="flex flex-wrap gap-3 px-6 pb-6">
            {categoryBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm text-text">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
                <span className="text-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="text-xl font-semibold text-text">Recent Transactions</h2>
          <div className="mt-4">
            {recentTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
          <Link href="/transactions" className="mt-4 inline-flex text-sm font-medium text-accent">
            View all transactions →
          </Link>
        </div>

        <div className="surface-card p-6">
          <h2 className="text-xl font-semibold text-text">Budget Progress</h2>
          <div className="mt-5">
            <BudgetBar category="Food" spent={85_000} limit={120_000} colorClass="bg-yellow" />
            <BudgetBar
              category="Transport"
              spent={38_200}
              limit={50_000}
              colorClass="bg-accent2"
            />
            <BudgetBar
              category="Entertainment"
              spent={42_000}
              limit={40_000}
              colorClass="bg-danger"
              showOverBudget
            />
            <BudgetBar
              category="Shopping"
              spent={28_500}
              limit={80_000}
              colorClass="bg-accent2"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
