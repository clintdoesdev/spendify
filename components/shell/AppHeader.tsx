"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Landmark, LogOut, Upload, UserPlus, X } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { ThemeButton, ThemeSegmented } from "@/components/theme/ThemeToggle";
import { Container } from "@/components/ui/kit";
import type { Viewer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/inflow", label: "True Inflow" },
  { href: "/budgets", label: "Budgets" },
  { href: "/goals", label: "Goals" },
];

export function AppHeader({ viewer, mode, canSignUp }: { viewer: Viewer; mode: "demo" | "live"; canSignUp: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-xl">
      {mode === "demo" && (
        <div className="bg-brand-wash">
          <Container className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-[13px] text-ink-soft">
            <span className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-brand" />
              {canSignUp
                ? "You're exploring sample data. Nothing you change is saved."
                : "Demo mode: sample statements, nothing is saved. Set DATABASE_URL to use your own."}
            </span>
            {canSignUp && (
              <span className="flex items-center gap-3">
                <Link href="/login?mode=signup" className="font-medium text-brand underline-offset-4 hover:underline">
                  Create your account
                </Link>
                <a href="/demo/exit" className="text-ink-soft underline-offset-4 hover:underline">
                  Exit demo
                </a>
              </span>
            )}
          </Container>
        </div>
      )}
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Link href="/overview" className="flex items-center gap-2.5" aria-label="Spendify overview">
          <LogoMark />
          <span className="text-[20px] font-black tracking-[-0.04em] text-ink">spendify</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[15px] font-semibold transition-all duration-300",
                isActive(item.href) ? "bg-ink text-canvas" : "text-ink-soft hover:bg-cloud hover:text-ink"
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
              "group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors sm:px-5",
              pathname.startsWith("/import") ? "bg-lime-deep text-forest" : "bg-lime text-forest hover:bg-lime-deep"
            )}
          >
            <Upload className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline">Import</span>
          </Link>
          <ThemeButton className="hidden sm:flex" />
          <AccountMenu viewer={viewer} mode={mode} canSignUp={canSignUp} />
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
                "shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-semibold whitespace-nowrap transition-colors",
                isActive(item.href) ? "bg-ink text-canvas" : "text-ink-soft"
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

function AccountMenu({ viewer, mode, canSignUp }: { viewer: Viewer; mode: "demo" | "live"; canSignUp: boolean }) {
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
        className="flex size-10 items-center justify-center rounded-full bg-cloud text-[14px] font-semibold text-ink transition-colors hover:bg-hairline focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        {viewer.initials}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-12 right-0 w-72 origin-top-right animate-pop rounded-2xl border border-hairline bg-raised p-2 shadow-float [animation-duration:0.25s]"
        >
          <p className="truncate px-3 py-2 text-[14px] text-ink-faint">{viewer.email}</p>
          <div className="px-1 pb-2">
            <ThemeSegmented />
          </div>
          <Link
            href="/accounts"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-cloud"
          >
            <Landmark className="size-4" /> Bank accounts
          </Link>
          {mode === "demo" && canSignUp && (
            <>
              <Link
                href="/login?mode=signup"
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-cloud"
              >
                <UserPlus className="size-4" /> Create account
              </Link>
              <a href="/demo/exit" role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-cloud">
                <X className="size-4" /> Exit demo
              </a>
            </>
          )}
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

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="relative flex items-center justify-center overflow-hidden rounded-[11px] bg-lime text-forest"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none">
        <path d="M17.5 6.5c-1.2-1.3-3-2-5.2-2-3.2 0-5.3 1.6-5.3 3.9 0 5.3 10.9 2.7 10.9 7.7 0 2.4-2.3 4-5.6 4-2.5 0-4.6-.9-5.9-2.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
