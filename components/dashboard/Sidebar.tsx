"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PieChart,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-surface px-5 py-6 md:block">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,111,255,0.35)]">
          S
        </div>
        <div>
          <p className="font-display text-xl font-bold text-text">spendify</p>
          <p className="text-xs text-muted">personal finance</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                isActive
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-white/5 hover:text-text"
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute right-5 bottom-6 left-5 rounded-[18px] border border-border bg-bg2/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
            CK
          </div>
          <div>
            <p className="text-sm font-medium text-text">Clinton K.</p>
            <span className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
              Free plan
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
