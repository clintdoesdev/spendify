"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import type { MonthFlow } from "@/lib/finance/analyze";
import { monthLabel } from "@/lib/finance/analyze";
import { formatNaira, formatNairaAxis } from "@/lib/money";

const RECEIVED = "#594ff4";
const SPENT = "#1f1f1f";
const TICK = { fill: "#6f6f6f", fontSize: 13 };

/** Received (violet) next to spent (ink), one pair per month. Clicking a month selects it. */
export function FlowChart({
  data,
  selected,
  onSelect,
}: {
  data: MonthFlow[];
  selected: string;
  onSelect: (month: string) => void;
}) {
  return (
    <div className="h-[280px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
        <BarChart
          data={data}
          barGap={3}
          barCategoryGap="24%"
          maxBarSize={40}
          margin={{ top: 8, right: 4 }}
          onClick={(state) => {
            const index = Number(state?.activeTooltipIndex);
            if (Number.isInteger(index) && data[index]) onSelect(data[index].month);
          }}
        >
          <CartesianGrid stroke="#e7e7e7" vertical={false} />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} tickMargin={10} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tickFormatter={(v) => formatNairaAxis(Number(v))} tick={TICK} axisLine={false} tickLine={false} width={58} />
          <Tooltip cursor={{ fill: "rgba(31,31,31,0.04)" }} content={(props) => <FlowTooltip {...props} />} />
          {(["received", "spent"] as const).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={key === "received" ? RECEIVED : SPENT}
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
              cursor="pointer"
              // Fade months other than the selected one.
              shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: MonthFlow }) => {
                const { x = 0, y = 0, width = 0, height = 0, payload } = props;
                if (height <= 0) return <g />;
                const r = Math.min(5, width / 2, height);
                const dim = payload?.month !== selected;
                return (
                  <path
                    d={`M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`}
                    fill={key === "received" ? RECEIVED : SPENT}
                    opacity={dim ? 0.35 : 1}
                  />
                );
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FlowTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as MonthFlow;
  const kept = row.received - row.spent;
  return (
    <div className="min-w-[220px] rounded-2xl border border-hairline bg-white p-4 shadow-float">
      <p className="text-[12px] font-medium tracking-[0.075em] text-ink-faint uppercase">{monthLabel(row.month, true)}</p>
      <div className="mt-3 space-y-2 text-[14px]">
        <Row color={RECEIVED} label="Received" value={formatNaira(row.received)} />
        <Row color={SPENT} label="Spent" value={formatNaira(row.spent)} />
        <div className="flex justify-between gap-6 border-t border-hairline pt-2 font-semibold">
          <span>{kept >= 0 ? "Kept" : "Overspent"}</span>
          <span className={kept >= 0 ? "text-gain tabular-nums" : "text-loss tabular-nums"}>{formatNaira(Math.abs(kept))}</span>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-ink-faint">Click to see this month</p>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-2 text-ink-soft">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-ink tabular-nums">{value}</span>
    </div>
  );
}
