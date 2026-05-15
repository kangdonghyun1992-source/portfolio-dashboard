"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssetAllocation } from "@/lib/types";

function formatKRW(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  return value.toLocaleString("ko-KR");
}

export default function AllocationChart({
  allocation,
  title = "자산 배분",
}: {
  allocation: AssetAllocation[];
  title?: string;
}) {
  const sorted = [...allocation].sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, a) => s + a.amount, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span>{title}</span>
          <span className="text-base font-normal tabular-nums text-muted-foreground">
            {total.toLocaleString("ko-KR")}원
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[200px] h-[200px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category"
                  isAnimationActive={false}
                >
                  {sorted.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${formatKRW(Number(value))}원`,
                    "금액",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 flex-1">
            {sorted.map((a) => (
              <div key={a.category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.color }}
                />
                <span className="text-sm flex-1">{a.category}</span>
                <span className="text-sm font-medium">{a.percent}%</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatKRW(a.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
