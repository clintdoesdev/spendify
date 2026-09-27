import { AS_OF } from "./mockStatements";
import {
  EXCLUSION_REASONS,
  INFLOW_SOURCES,
  type BankAccount,
  type ClassifiedCredit,
  type ExclusionReason,
  type InflowSource,
  type Span,
} from "./types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type InflowBucket = Record<InflowSource, number> & {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  cumulative: number;
  previousCumulative: number | null;
};

export type InflowSummary = {
  label: string;
  startMonth: string;
  endMonth: string;
  monthCount: number;
  granularity: "month" | "quarter";
  buckets: InflowBucket[];
  total: number;
  gross: number;
  previousTotal: number | null;
  bySource: Record<InflowSource, number>;
  excluded: Record<ExclusionReason, { amount: number; count: number }>;
  byAccount: { account: BankAccount; amount: number }[];
  topPayers: { name: string; amount: number; count: number; source: InflowSource }[];
  averagePerMonth: number;
  bestBucket: InflowBucket | null;
  activeMonths: number;
  includedCount: number;
};

export type YearRow = {
  year: number;
  total: number;
  months: number;
  /** Like-for-like growth: a partial year is compared with the same months last year. */
  growth: number | null;
  realGrowth: number | null;
};

// Months are handled as integers (year * 12 + monthIndex) to keep range math trivial.
const toIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const fromIndex = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
const monthLabel = (i: number) => `${MONTH_NAMES[i % 12]} ${Math.floor(i / 12)}`;

export const AS_OF_MONTH = toIndex(AS_OF.slice(0, 7));

export function resolveSpan(span: Span, earliestMonth: string) {
  const first = toIndex(earliestMonth);
  let start: number;
  let end = AS_OF_MONTH;
  let label: string;

  if (span.kind === "trailing") {
    start = Math.max(first, AS_OF_MONTH - span.years * 12 + 1);
    label = span.years === 1 ? "Last 12 months" : `Last ${span.years} years`;
  } else if (span.kind === "year") {
    start = Math.max(first, span.year * 12);
    end = Math.min(AS_OF_MONTH, span.year * 12 + 11);
    label = end < span.year * 12 + 11 ? `${span.year} so far` : String(span.year);
  } else {
    start = first;
    label = "All time";
  }
  return { start, end, label };
}

function emptyBySource() {
  return Object.fromEntries(INFLOW_SOURCES.map((s) => [s, 0])) as Record<InflowSource, number>;
}

export function summarize(
  credits: ClassifiedCredit[],
  accounts: BankAccount[],
  span: Span,
  earliestMonth: string
): InflowSummary {
  const { start, end, label } = resolveSpan(span, earliestMonth);
  const monthCount = end - start + 1;
  const granularity = monthCount > 24 ? "quarter" : "month";
  const bucketOf = (m: number) => (granularity === "month" ? m - start : Math.floor((m - start) / 3));
  const bucketCount = bucketOf(end) + 1;

  const buckets: InflowBucket[] = Array.from({ length: bucketCount }, (_, b) => {
    const first = granularity === "month" ? start + b : start + b * 3;
    const last = granularity === "month" ? first : Math.min(first + 2, end);
    const q = Math.floor((first % 12) / 3) + 1;
    return {
      ...emptyBySource(),
      key: fromIndex(first),
      label:
        granularity === "month"
          ? monthCount > 12
            ? `${MONTH_NAMES[first % 12]} ’${String(Math.floor(first / 12)).slice(2)}`
            : MONTH_NAMES[first % 12]
          : `Q${q} ’${String(Math.floor(first / 12)).slice(2)}`,
      fullLabel: first === last ? monthLabel(first) : `${monthLabel(first)} – ${monthLabel(last)}`,
      total: 0,
      cumulative: 0,
      previousCumulative: null,
    };
  });

  const bySource = emptyBySource();
  const excluded = Object.fromEntries(
    EXCLUSION_REASONS.map((r) => [r, { amount: 0, count: 0 }])
  ) as InflowSummary["excluded"];
  const byAccountMap = new Map<string, number>();
  const payers = new Map<string, { amount: number; count: number; source: InflowSource }>();
  const monthTotals = new Map<number, number>();
  const previousBuckets = new Array<number>(bucketCount).fill(0);
  // A calendar year compares with the same months last year; rolling spans with the window before.
  const shift = span.kind === "year" ? 12 : monthCount;
  const previousStart = start - shift;
  const previousEnd = previousStart + monthCount - 1;
  let hasPrevious = previousStart >= toIndex(earliestMonth);
  let total = 0;
  let gross = 0;
  let previousTotal = 0;
  let includedCount = 0;

  for (const credit of credits) {
    const m = toIndex(credit.line.date.slice(0, 7));
    const { amount } = credit.line;

    if (credit.included && m >= previousStart && m <= previousEnd) {
      previousTotal += amount;
      previousBuckets[bucketOf(m + shift)] += amount;
    }
    if (m < start || m > end) continue;

    gross += amount;
    if (!credit.included) {
      if (credit.reason) {
        excluded[credit.reason].amount += amount;
        excluded[credit.reason].count += 1;
      }
      continue;
    }

    includedCount += 1;
    total += amount;
    bySource[credit.source] += amount;
    const bucket = buckets[bucketOf(m)];
    bucket[credit.source] += amount;
    bucket.total += amount;
    monthTotals.set(m, (monthTotals.get(m) ?? 0) + amount);
    byAccountMap.set(credit.line.accountId, (byAccountMap.get(credit.line.accountId) ?? 0) + amount);

    const payer = payers.get(credit.line.counterparty) ?? { amount: 0, count: 0, source: credit.source };
    payer.amount += amount;
    payer.count += 1;
    payers.set(credit.line.counterparty, payer);
  }

  if (span.kind === "all") hasPrevious = false;

  let running = 0;
  let previousRunning = 0;
  buckets.forEach((bucket, i) => {
    running += bucket.total;
    previousRunning += previousBuckets[i];
    bucket.cumulative = running;
    bucket.previousCumulative = hasPrevious ? previousRunning : null;
  });

  const bestBucket = buckets.reduce<InflowBucket | null>(
    (best, b) => (b.total > (best?.total ?? 0) ? b : best),
    null
  );

  return {
    label,
    startMonth: fromIndex(start),
    endMonth: fromIndex(end),
    monthCount,
    granularity,
    buckets,
    total,
    gross,
    previousTotal: hasPrevious ? previousTotal : null,
    bySource,
    excluded,
    byAccount: accounts
      .map((account) => ({ account, amount: byAccountMap.get(account.id) ?? 0 }))
      .sort((a, b) => b.amount - a.amount),
    topPayers: [...payers.entries()]
      .map(([name, p]) => ({ name, ...p }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6),
    averagePerMonth: total / monthCount,
    bestBucket,
    activeMonths: monthTotals.size,
    includedCount,
  };
}

export function yearRows(
  credits: ClassifiedCredit[],
  earliestMonth: string,
  inflation: Record<number, number>
): YearRow[] {
  const firstYear = Number(earliestMonth.slice(0, 4));
  const lastYear = Math.floor(AS_OF_MONTH / 12);
  const lastMonthOfAsOfYear = AS_OF_MONTH % 12;
  const byMonth = new Map<number, number>();

  for (const credit of credits) {
    if (!credit.included) continue;
    const m = toIndex(credit.line.date.slice(0, 7));
    byMonth.set(m, (byMonth.get(m) ?? 0) + credit.line.amount);
  }

  const sumYear = (year: number, uptoMonth = 11) => {
    let sum = 0;
    for (let i = 0; i <= uptoMonth; i++) sum += byMonth.get(year * 12 + i) ?? 0;
    return sum;
  };

  const rows: YearRow[] = [];
  for (let year = lastYear; year >= firstYear; year--) {
    const partial = year === lastYear;
    const upto = partial ? lastMonthOfAsOfYear : 11;
    const total = sumYear(year, upto);
    const previous = year > firstYear ? sumYear(year - 1, upto) : 0;
    const growth = previous > 0 ? total / previous - 1 : null;
    const rate = inflation[year];
    rows.push({
      year,
      total,
      months: upto + 1,
      growth,
      realGrowth: growth !== null && rate !== undefined ? (1 + growth) / (1 + rate) - 1 : null,
    });
  }
  return rows;
}
