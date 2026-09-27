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
import { formatNaira, formatNairaAxis, formatPercent } from "@/lib/money";

import { sourceLabel } from "./meta";

// Chart roles, drawn from the light system tokens.
const SURFACE = "#f6f6f6";
const VIOLET = "#594ff4";
const CONTEXT = "#d4d4d8";
const PREVIOUS = "#a3a3a3";
const GRID = "#e7e7e7";
const TICK = { fill: "#6f6f6f", fontSize: 13, fontFamily: "var(--font-inter)" };

type Row = InflowBucket & { focus: number; rest: number };
type ShapeProps = React.ComponentProps<typeof Rectangle> & { payload?: Row };

export function InflowBars({
  data,
  mode,
  focus,
  hasPrevious,
}: {
  data: InflowBucket[];
  mode: "bars" | "running";
  focus: InflowSource | null;
  hasPrevious: boolean;
}) {
  const rows: Row[] = data.map((bucket) => {
    const focused = focus ? bucket[focus] : bucket.total;
    return { ...bucket, focus: focused, rest: bucket.total - focused };
  });

  const axes = (
    <>
      <CartesianGrid stroke={GRID} vertical={false} />
      <XAxis
        dataKey="label"
        tick={TICK}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={18}
        tickMargin={10}
      />
      <YAxis
        tickFormatter={(v) => formatNairaAxis(Number(v))}
        tick={TICK}
        axisLine={false}
        tickLine={false}
        width={58}
      />
    </>
  );

  return (
    <div className="h-[300px] w-full sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
        {mode === "bars" ? (
          <BarChart data={rows} barCategoryGap={rows.length > 16 ? "16%" : "26%"} margin={{ top: 8, right: 4 }}>
            {axes}
            <Tooltip
              cursor={{ fill: "rgba(31,31,31,0.04)" }}
              content={(props) => <BarTooltip {...props} focus={focus} />}
            />
            {(["focus", "rest"] as const).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="inflow"
                fill={key === "focus" ? VIOLET : CONTEXT}
                stroke={SURFACE}
                strokeWidth={2}
                isAnimationActive={false}
                shape={(props: ShapeProps) => {
                  const row = props.payload;
                  const isTop = key === "rest" ? (row?.rest ?? 0) > 0 : (row?.rest ?? 0) === 0;
                  return <Rectangle {...props} radius={isTop ? [6, 6, 0, 0] : 0} />;
                }}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={rows} margin={{ top: 8, right: 16 }}>
            {axes}
            <Tooltip cursor={{ stroke: "#b0b0b0" }} content={(props) => <RunningTooltip {...props} />} />
            {hasPrevious && (
              <Area
                type="monotone"
                dataKey="previousCumulative"
                stroke={PREVIOUS}
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{ r: 4, fill: PREVIOUS, stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={VIOLET}
              strokeWidth={2.5}
              fill={VIOLET}
              fillOpacity={0.07}
              dot={false}
              activeDot={{ r: 5, fill: VIOLET, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[240px] rounded-2xl border border-hairline bg-white p-4 shadow-float">
      <p className="text-[12px] font-medium tracking-[0.075em] text-ink-faint uppercase">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Line({ label, value, strong, dot }: { label: string; value: string; strong?: boolean; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[14px]">
      <span className={strong ? "font-semibold text-ink" : "text-ink-soft"}>
        {dot && <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: dot }} />}
        {label}
      </span>
      <span className={strong ? "font-semibold text-ink tabular-nums" : "text-ink tabular-nums"}>{value}</span>
    </div>
  );
}

function BarTooltip({ active, payload, focus }: TooltipContentProps & { focus: InflowSource | null }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;

  return (
    <Shell title={row.fullLabel}>
      {focus ? (
        <>
          <Line label={sourceLabel[focus]} value={formatNaira(row.focus)} dot={VIOLET} />
          <Line label="Everything else" value={formatNaira(row.rest)} dot={CONTEXT} />
          <div className="border-t border-hairline pt-2">
            <Line label="Total received" value={formatNaira(row.total)} strong />
          </div>
          {row.total > 0 && (
            <p className="text-[13px] text-ink-faint">
              {sourceLabel[focus]} was {formatPercent(row.focus / row.total)} of this{" "}
              {row.fullLabel.includes("–") ? "quarter" : "month"}.
            </p>
          )}
        </>
      ) : (
        <>
          {INFLOW_SOURCES.filter((s) => row[s] > 0).map((s) => (
            <Line key={s} label={sourceLabel[s]} value={formatNaira(row[s])} />
          ))}
          <div className="border-t border-hairline pt-2">
            <Line label="Total received" value={formatNaira(row.total)} strong />
          </div>
        </>
      )}
    </Shell>
  );
}

function RunningTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  const previous = row.previousCumulative;

  return (
    <Shell title={`By end of ${row.fullLabel.split(" – ").pop()}`}>
      <Line label="This period" value={formatNaira(row.cumulative)} dot={VIOLET} />
      {previous !== null && <Line label="Period before" value={formatNaira(previous)} dot={PREVIOUS} />}
      {previous ? (
        <p className="border-t border-hairline pt-2 text-[13px] text-ink-faint">
          <span className={row.cumulative >= previous ? "font-semibold text-gain" : "font-semibold text-loss"}>
            {row.cumulative >= previous ? "Ahead" : "Behind"} by {formatNaira(Math.abs(row.cumulative - previous))}
          </span>{" "}
          at this point
        </p>
      ) : null}
    </Shell>
  );
}
