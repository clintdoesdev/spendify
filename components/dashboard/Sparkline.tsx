"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const chartData = data.map((value, index) => ({ day: index + 1, value }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={40}>
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
