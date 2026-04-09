"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthData } from "@/lib/mockData";

export function OverviewChart({ data }: { data: MonthData[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4FEFB0" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#4FEFB0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5C5C" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#FF5C5C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(240,238,228,0.45)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `₦${value / 1000}k`}
            tick={{ fill: "rgba(240,238,228,0.45)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.08)" }}
            contentStyle={{
              backgroundColor: "#111118",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#F0EEE4",
            }}
            formatter={(value) => [
              new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0,
              }).format(Number(value ?? 0)),
            ]}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#4FEFB0"
            strokeWidth={2}
            fill="url(#incomeFill)"
            isAnimationActive
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#FF5C5C"
            strokeWidth={2}
            fill="url(#expenseFill)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
