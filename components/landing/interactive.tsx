"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

import { CountUp } from "@/components/motion/CountUp";
import { Segmented } from "@/components/ui/kit";
import { formatNairaCompact, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Sticky header that tightens and gains a border once you scroll. */
export function NavShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled ? "border-b border-hairline bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent bg-canvas"
      )}
    >
      <div className={cn("transition-[height] duration-300", scrolled ? "h-[64px]" : "h-[76px]")}>{children}</div>
    </header>
  );
}

type Span = {
  years: number;
  total: number;
  gross: number;
  ownMoves: number;
  savings: number;
  bounced: number;
  transfers: number;
};

/** "What your statements say" vs "what you received", for a span the visitor picks. */
export function SpanDemo({ spans }: { spans: Span[] }) {
  const [years, setYears] = useState(1);
  const span = spans.find((s) => s.years === years) ?? spans[0];
  const leftOut = span.gross - span.total;

  return (
    <div className="rounded-[28px] bg-cloud p-6 sm:p-10 lg:p-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-wash px-3 py-1 text-[12px] font-semibold tracking-[0.06em] text-brand uppercase">
            Try it
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.6rem)] leading-[0.95] font-black tracking-[-0.04em] text-ink">
            Pick a span. Watch the double counting disappear.
          </h2>
        </div>
        <div className="shrink-0">
          <Segmented
          label="Span"
          value={String(years)}
          onChange={(v) => setYears(Number(v))}
          options={spans.map((s) => ({ value: String(s.years), label: s.years === 1 ? "1 year" : `${s.years} years`, short: `${s.years}Y` }))}
          />
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <Bar
          label="What your statements say came in"
          value={span.gross}
          ratio={1}
          tone="context"
        />
        <Bar label="What you actually received" value={span.total} ratio={span.total / span.gross} tone="brand" />
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-hairline pt-8 lg:grid-cols-4">
        <Fact label="Wasn't income" value={formatPercent(leftOut / span.gross)} />
        <Fact label="Moved between own accounts" value={formatNairaCompact(span.ownMoves)} />
        <Fact label="Transfers matched, both sides" value={span.transfers.toLocaleString("en-NG")} />
        <Fact label="Savings, reversals & loans" value={formatNairaCompact(span.savings + span.bounced)} />
      </dl>
      <p className="mt-8 text-[13px] text-ink-faint">Sample data from the demo: four banks, five years of statements.</p>
    </div>
  );
}

function Bar({ label, value, ratio, tone }: { label: string; value: number; ratio: number; tone: "brand" | "context" }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-[16px] font-medium text-ink-soft">{label}</span>
        <CountUp
          value={value}
          format="naira"
          duration={900}
          className={cn(
            "text-[clamp(1.75rem,4vw,3rem)] leading-none font-black tracking-[-0.045em] tabular-nums",
            tone === "brand" ? "text-ink" : "text-ink-faint line-through decoration-[3px] decoration-pebble/60"
          )}
        />
      </div>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-sunken">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.1,1)]",
            tone === "brand" ? "bg-brand" : "bg-context"
          )}
          style={{ width: `${Math.max(ratio * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[14px] text-ink-faint">{label}</dt>
      <dd className="mt-1 text-[26px] leading-none font-black tracking-[-0.035em] text-ink tabular-nums sm:text-[30px]">
        {value}
      </dd>
    </div>
  );
}

/** Wise-style floating badge: a quiet nudge to try the demo, once you're past the hero. */
export function FloatingCta({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (dismissed) return null;
  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 w-[248px] rounded-[20px] bg-forest p-4 text-white shadow-float transition-all duration-500 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      )}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full text-forest-soft hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>
      <p className="pr-6 text-[15px] leading-snug font-semibold">See your real number in two minutes.</p>
      <Link
        href={href}
        className="group mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-4 text-[14px] font-semibold text-forest transition-colors hover:bg-lime-deep"
      >
        Try the demo <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
