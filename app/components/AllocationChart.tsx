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
}: {
  allocation: AssetAllocation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ""} ${props.percent ?? 0}%`
                }
                labelLine={false}
              >
                {allocation.map((entry, i) => (
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
          <div className="space-y-2 min-w-[180px]">
            {allocation.map((a) => (
              <div key={a.category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                <span className="text-sm flex-1">{a.category}</span>
                <span className="text-sm font-medium">{a.percent}%</span>
                <span className="text-xs text-muted-foreground">
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
