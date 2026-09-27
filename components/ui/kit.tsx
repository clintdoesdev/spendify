"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { bankColor, bankInitials } from "@/lib/finance/banks";
import type { BankAccount } from "@/lib/inflow/types";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-[13px] font-medium tracking-[0.075em] text-ink-faint uppercase", className)}>
      {children}
    </p>
  );
}

/** Cloud surface, 36px radius, depth from tint rather than shadow. */
export function Card({
  className,
  children,
  as: Tag = "section",
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn("rounded-[28px] bg-cloud p-6 sm:rounded-[36px] sm:p-8", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.01em] text-ink sm:text-[26px]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

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
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-cloud p-1 [scrollbar-width:none]"
    >
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
              "shrink-0 rounded-full font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
              size === "md" ? "h-10 px-4 text-[15px]" : "h-8 px-3.5 text-[14px]",
              active ? "bg-violet text-white" : "text-ink-soft hover:text-ink"
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" | "inverse" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        variant === "primary" && "bg-violet text-white hover:bg-violet-deep",
        variant === "ghost" && "border border-violet text-violet hover:bg-violet-wash",
        variant === "quiet" && "border border-hairline bg-white text-ink hover:border-ash",
        variant === "inverse" && "bg-white text-ink hover:bg-cloud",
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
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
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
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:outline-none",
        checked ? "bg-violet" : "bg-ash/60"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white transition-transform",
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

export function TextField({
  label,
  hint,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[14px] text-ink-soft">{label}</span>
      <input
        className="mt-1.5 block h-12 w-full rounded-2xl border border-hairline bg-white px-4 text-[16px] text-ink placeholder:text-ash focus:border-violet focus:ring-2 focus:ring-violet/20 focus:outline-none"
        {...rest}
      />
      {hint && <span className="mt-1.5 block text-[13px] text-ink-faint">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[14px] text-ink-soft">{label}</span>
      <select
        className="mt-1.5 block h-12 w-full appearance-none rounded-2xl border border-hairline bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%231f1f1f%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[position:right_16px_center] bg-no-repeat px-4 pr-10 text-[16px] text-ink focus:border-violet focus:ring-2 focus:ring-violet/20 focus:outline-none"
        {...rest}
      >
        {children}
      </select>
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
        "rounded-2xl px-4 py-3 text-[15px]",
        tone === "info" && "bg-violet-wash text-ink",
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
    <div className="flex flex-col gap-5 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between sm:pt-14 sm:pb-10">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.025em] text-ink sm:text-[44px]">
          {title}
        </h1>
        {description && <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
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
    <div className="rounded-[28px] border border-dashed border-ash/70 px-6 py-14 text-center sm:rounded-[36px]">
      <p className="text-[20px] font-bold tracking-[-0.01em] text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[16px] text-ink-soft">{body}</p>
      {action && <div className="mt-6 flex justify-center gap-3">{action}</div>}
    </div>
  );
}
