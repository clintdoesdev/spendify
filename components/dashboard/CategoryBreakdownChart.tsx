"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategoryBreakdown } from "@/lib/mockData";

export function CategoryBreakdownChart({
  data,
}: {
  data: CategoryBreakdown[];
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            isAnimationActive
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#111118",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#F0EEE4",
            }}
            formatter={(value) => [`${value ?? 0}%`, "Share"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
