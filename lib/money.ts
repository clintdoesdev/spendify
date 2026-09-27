const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number) {
  return nairaFormatter.format(Math.round(amount));
}

export function formatNairaCompact(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}₦${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}₦${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}₦${trim(abs / 1_000)}k`;
  return `${sign}₦${Math.round(abs)}`;
}

export function formatPercent(ratio: number, { signed = false } = {}) {
  const value = (ratio * 100).toFixed(Math.abs(ratio) < 0.1 ? 1 : 0);
  return `${signed && ratio > 0 ? "+" : ""}${value}%`;
}

function trim(value: number) {
  return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

/** Short, trailing-zero-free labels for chart axes: ₦600k, ₦2.4M, ₦12M. */
export function formatNairaAxis(amount: number) {
  const abs = Math.abs(amount);
  const strip = (v: number) => String(Number(v.toFixed(1)));
  if (abs >= 1_000_000) return `₦${strip(amount / 1_000_000)}M`;
  if (abs >= 1_000) return `₦${strip(amount / 1_000)}k`;
  return `₦${Math.round(amount)}`;
}
