"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";

import { bankColor, bankInitials } from "@/lib/finance/banks";
import type { BankAccount } from "@/lib/inflow/types";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/** Linen-mist badge, the Wise tag style: section labels above headings. */
export function Eyebrow({
  className,
  children,
  onForest,
}: {
  className?: string;
  children: React.ReactNode;
  /** On a forest panel: lime text on a translucent pill. */
  onForest?: boolean;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold tracking-[0.06em] uppercase",
        onForest ? "bg-white/10 text-lime" : "bg-brand-wash text-brand",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Large card: soft surface, 28px radius, depth from tint. `interactive` lifts on hover. */
export function Card({
  className,
  children,
  as: Tag = "section",
  interactive,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div";
  interactive?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "rounded-[24px] bg-cloud p-6 sm:rounded-[28px] sm:p-8",
        interactive && "transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[26px]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pill tab switcher. The lime indicator slides to the active option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: { value: T; label: string; short?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const active = wrap.current?.querySelector<HTMLElement>('[aria-checked="true"]');
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [value, options.length]);

  return (
    <div
      ref={wrap}
      role="radiogroup"
      aria-label={label}
      className="relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-cloud p-1 [scrollbar-width:none]"
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 rounded-full bg-lime transition-[transform,width,opacity] duration-400 ease-[cubic-bezier(0.3,1.2,0.5,1)]",
          indicator ? "opacity-100" : "opacity-0"
        )}
        style={{ width: indicator?.width ?? 0, transform: `translateX(${(indicator?.left ?? 0) - 4}px)`, left: 4 }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 shrink-0 rounded-full font-semibold whitespace-nowrap transition-colors",
              size === "md" ? "h-10 px-4 text-[15px]" : "h-8 px-3.5 text-[14px]",
              active ? "text-forest" : "text-ink-soft hover:text-ink"
            )}
          >
            {option.short ? (
              <>
                <span className="sm:hidden">{option.short}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </>
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PillButton({
  variant = "primary",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" | "inverse" | "danger" }) {
  return (
    <button
      type="button"
      className={cn(
        "group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" && "bg-lime text-forest hover:bg-lime-deep",
        variant === "ghost" && "border border-brand text-brand hover:bg-brand hover:text-canvas",
        variant === "quiet" && "border border-hairline bg-raised text-ink hover:border-pebble",
        variant === "inverse" && "bg-white text-forest hover:bg-lime",
        variant === "danger" && "bg-loss text-white hover:opacity-90",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function BankAvatar({ account, size = 28 }: { account: Pick<BankAccount, "institution">; size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-canvas/0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: bankColor(account.institution),
      }}
    >
      {bankInitials(account.institution)}
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300",
        checked ? "bg-brand" : "bg-pebble/50"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)]",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function DeltaChip({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tabular-nums",
        size === "md" ? "h-8 px-3 text-[15px]" : "h-6 px-2 text-[13px]",
        up ? "bg-gain-wash text-gain" : "bg-loss-wash text-loss"
      )}
    >
      <Icon className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={2.25} />
      {formatPercent(Math.abs(value))}
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

const fieldClass =
  "block h-12 w-full rounded-[12px] border border-pebble/45 bg-raised px-4 text-[16px] text-ink transition-colors placeholder:text-pebble hover:border-pebble focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none";

export function TextField({
  label,
  hint,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[14px] font-medium text-ink-soft">{label}</span>
      <input className={cn(fieldClass, "mt-1.5")} {...rest} />
      {hint && <span className="mt-1.5 block text-[13px] text-ink-faint">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  hideLabel,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean }) {
  return (
    <label className={cn("block", className)}>
      <span className={hideLabel ? "sr-only" : "text-[14px] font-medium text-ink-soft"}>{label}</span>
      <span className={cn("relative block", !hideLabel && "mt-1.5")}>
        <select className={cn(fieldClass, "appearance-none pr-10")} {...rest}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink" />
      </span>
    </label>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "error" | "warn";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "animate-rise rounded-2xl px-4 py-3 text-[15px]",
        tone === "info" && "bg-brand-wash text-ink",
        tone === "success" && "bg-gain-wash text-gain",
        tone === "error" && "bg-loss-wash text-loss",
        tone === "warn" && "bg-warn-wash text-warn",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Page opener: badge, heavy display title, supporting line. Rises in on load. */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between sm:pt-14 sm:pb-12">
      <div className="max-w-3xl">
        <div className="animate-rise">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <h1
          className="mt-4 animate-rise text-[40px] leading-[0.95] font-black tracking-[-0.04em] text-ink [animation-delay:80ms] sm:text-[58px]"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-4 animate-rise text-[17px] leading-relaxed text-ink-soft [animation-delay:160ms]">{description}</p>
        )}
      </div>
      {action && <div className="animate-rise [animation-delay:200ms]">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-rise rounded-[28px] bg-cloud px-6 py-16 text-center">
      <CoinsArt className="mx-auto h-24 w-auto" />
      <p className="mt-6 text-[24px] font-black tracking-[-0.03em] text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[16px] text-ink-soft">{body}</p>
      {action && <div className="mt-7 flex justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Flat coin-stack mark: Spendify's small take on the Wise coin motif. */
export function CoinsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden>
      <g className="animate-float">
        <ellipse cx="44" cy="70" rx="30" ry="9" fill="#163300" />
        <rect x="14" y="52" width="60" height="18" fill="#163300" />
        <ellipse cx="44" cy="52" rx="30" ry="9" fill="#9fe870" />
        <ellipse cx="44" cy="52" rx="17" ry="4.5" fill="none" stroke="#163300" strokeWidth="2.5" opacity=".35" />
      </g>
      <g className="animate-float [animation-delay:-2.5s]">
        <circle cx="86" cy="34" r="22" fill="#9fe870" />
        <circle cx="86" cy="34" r="22" fill="none" stroke="#163300" strokeWidth="3" />
        <text x="86" y="42" textAnchor="middle" fontSize="23" fontWeight="900" fill="#163300" fontFamily="Inter Variable, sans-serif">
          ₦
        </text>
      </g>
    </svg>
  );
}
