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

const items = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/budgets", icon: PieChart, label: "Budgets" },
  { href: "/goals", icon: Target, label: "Goals" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-around">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[11px]",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="size-5" />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
