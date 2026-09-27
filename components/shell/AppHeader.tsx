"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Landmark, LogOut, Upload } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Container } from "@/components/ui/kit";
import type { Viewer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/inflow", label: "True Inflow" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
];

export function AppHeader({ viewer, mode }: { viewer: Viewer; mode: "demo" | "live" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-white/90 backdrop-blur-md">
      {mode === "demo" && (
        <div className="bg-violet-wash">
          <Container className="flex items-center justify-center gap-2 py-2 text-center text-[13px] text-ink-soft">
            <span className="size-1.5 shrink-0 rounded-full bg-violet" />
            Demo mode: sample statements, nothing is saved. Add the env vars in .env.example to use your own.
          </Container>
        </div>
      )}
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Spendify overview">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet text-[17px] font-bold text-white">
            S
          </span>
          <span className="text-[19px] font-bold tracking-[-0.01em] text-ink">spendify</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[15px] transition-colors",
                isActive(item.href) ? "bg-cloud text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/import"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors sm:px-5",
              pathname.startsWith("/import") ? "bg-violet-deep text-white" : "bg-violet text-white hover:bg-violet-deep"
            )}
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Import</span>
          </Link>
          <AccountMenu viewer={viewer} mode={mode} />
        </div>
      </Container>

      <nav aria-label="Main" className="border-t border-hairline lg:hidden">
        <Container className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[14px] whitespace-nowrap",
                isActive(item.href) ? "bg-cloud text-ink" : "text-ink-soft"
              )}
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </nav>
    </header>
  );
}

function AccountMenu({ viewer, mode }: { viewer: Viewer; mode: "demo" | "live" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-full bg-cloud text-[14px] font-semibold text-ink transition-colors hover:bg-hairline focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none"
      >
        {viewer.initials}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-12 right-0 w-64 rounded-2xl border border-hairline bg-white p-2 shadow-float"
        >
          <p className="truncate px-3 py-2 text-[14px] text-ink-faint">{viewer.email}</p>
          <Link
            href="/accounts"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-cloud"
          >
            <Landmark className="size-4" /> Bank accounts
          </Link>
          {mode === "live" && (
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-ink hover:bg-cloud"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
