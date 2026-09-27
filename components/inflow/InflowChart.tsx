"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import type { InflowBucket } from "@/lib/inflow/aggregate";
import { INFLOW_SOURCES, type InflowSource } from "@/lib/inflow/types";
import { formatNaira, formatNairaCompact } from "@/lib/money";

import { sourceMeta } from "./meta";

const SURFACE = "#16161e";
const AXIS_TICK = { fill: "rgba(240,238,228,0.45)", fontSize: 12 };
const GRID = "rgba(255,255,255,0.05)";

type BarShapeProps = React.ComponentProps<typeof Rectangle> & { payload?: unknown };

type Props = {
  data: InflowBucket[];
  mode: "breakdown" | "cumulative";
  hidden: Set<InflowSource>;
  hasPrevious: boolean;
};

export function InflowChart({ data, mode, hidden, hasPrevious }: Props) {
  const visible = INFLOW_SOURCES.filter((s) => !hidden.has(s));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
        {mode === "breakdown" ? (
          <BarChart data={data} barCategoryGap={data.length > 16 ? "18%" : "28%"}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis
              tickFormatter={(v) => formatNairaCompact(Number(v))}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
              content={(props) => <BreakdownTooltip {...props} visible={visible} />}
            />
            {visible.map((source) => (
              <Bar
                key={source}
                dataKey={source}
                stackId="inflow"
                fill={sourceMeta[source].color}
                stroke={SURFACE}
                strokeWidth={2}
                animationDuration={600}
                // Round only the top-most non-empty segment of each stack.
                shape={(props: BarShapeProps) => {
                  const bucket = props.payload as InflowBucket;
                  const top = visible.findLast((s) => bucket[s] > 0);
                  return <Rectangle {...props} radius={top === source ? [5, 5, 0, 0] : 0} />;
                }}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ right: 16 }}>
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c6fff" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#7c6fff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis
              tickFormatter={(v) => formatNairaCompact(Number(v))}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.14)" }}
              content={(props) => <CumulativeTooltip {...props} />}
            />
            {hasPrevious && (
              <Area
                type="monotone"
                dataKey="previousCumulative"
                stroke="rgba(240,238,228,0.35)"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{ r: 4, fill: "#a8a8b3", stroke: SURFACE, strokeWidth: 2 }}
                animationDuration={600}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#7c6fff"
              strokeWidth={2}
              fill="url(#cumulativeFill)"
              dot={false}
              activeDot={{ r: 5, fill: "#7c6fff", stroke: SURFACE, strokeWidth: 2 }}
              animationDuration={600}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function TooltipShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[220px] rounded-2xl border border-border bg-bg2/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function BreakdownTooltip({
  active,
  payload,
  visible,
}: TooltipContentProps & { visible: InflowSource[] }) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload as InflowBucket;
  const total = visible.reduce((sum, s) => sum + bucket[s], 0);

  return (
    <TooltipShell title={bucket.fullLabel}>
      {[...visible].reverse().filter((source) => bucket[source] > 0).map((source) => (
        <div key={source} className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: sourceMeta[source].color }} />
            {sourceMeta[source].short}
          </span>
          <span className="tabular-nums text-text">{formatNaira(bucket[source])}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-6 border-t border-border pt-2 text-sm font-medium">
        <span className="text-text">Total</span>
        <span className="tabular-nums text-text">{formatNaira(total)}</span>
      </div>
    </TooltipShell>
  );
}

function CumulativeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload as InflowBucket;
  const previous = bucket.previousCumulative;
  const delta = previous ? bucket.cumulative / previous - 1 : null;

  return (
    <TooltipShell title={`Up to ${bucket.fullLabel.split(" – ").pop()}`}>
      <div className="flex items-center justify-between gap-6 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <span className="h-0.5 w-3 rounded-full bg-accent" />
          This period
        </span>
        <span className="tabular-nums text-text">{formatNaira(bucket.cumulative)}</span>
      </div>
      {previous !== null && (
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-0.5 w-3 rounded-full bg-soft/60" />
            Period before
          </span>
          <span className="tabular-nums text-text">{formatNaira(previous)}</span>
        </div>
      )}
      {delta !== null && (
        <p className="border-t border-border pt-2 text-xs text-muted">
          <span className={delta >= 0 ? "text-accent2" : "text-danger"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(1)}%
          </span>{" "}
          vs the same point last period
        </p>
      )}
    </TooltipShell>
  );
}
