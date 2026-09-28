"use client";

import { useEffect, useRef, useState } from "react";

import { formatNaira, formatNairaCompact, formatPercent } from "@/lib/money";

const formats = {
  naira: formatNaira,
  compact: formatNairaCompact,
  percent: (n: number) => formatPercent(n),
  int: (n: number) => Math.round(n).toLocaleString("en-NG"),
};

/**
 * Counts from its previous value (or 0) to `value` when first scrolled into view, and
 * animates again whenever `value` changes. Server-rendered with the final value, so it's
 * correct without JS and for screen readers.
 */
export function CountUp({
  value,
  format = "naira",
  duration = 1100,
  className,
}: {
  value: number;
  format?: keyof typeof formats;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const from = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      from.current = value;
      return;
    }
    let frame = 0;
    const run = () => {
      const start = from.current ?? 0;
      const began = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - began) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(start + (value - start) * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
        else from.current = value;
      };
      frame = requestAnimationFrame(tick);
    };
    if (from.current !== null) {
      run();
      return () => cancelAnimationFrame(frame);
    }
    setDisplay(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{formats[format](display)}</span>
      <span className="sr-only">{formats[format](value)}</span>
    </span>
  );
}
