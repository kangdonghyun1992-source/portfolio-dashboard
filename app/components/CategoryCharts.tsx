"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryPoint {
  label: string;
  cash: number;
  stocks: number;
  crypto: number;
  realEstate: number;
  pension: number;
  [key: string]: string | number;
}

function formatKRW(v: number): string {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
  if (v >= 10_000) return `${Math.round(v / 10_000)}만`;
  return v.toLocaleString("ko-KR");
}

// Pie chart for sub-breakdown within a category
export function SubPieChart({
  data,
  title,
}: {
  data: { name: string; value: number; color: string }[];
  title: string;
}) {
  const filtered = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (filtered.length === 0) return null;
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} 구성</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[180px] h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={false}
                >
                  {filtered.map((entry, i) => (
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
          <div className="space-y-1.5 flex-1">
            {filtered.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm flex-1 truncate">{d.name}</span>
                <span className="text-sm font-medium tabular-nums">{(d.value / total * 100).toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatKRW(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Trend line chart for a specific category
export function CategoryTrendChart({
  dataKey,
  title,
  color,
  refreshKey = 0,
}: {
  dataKey: string;
  title: string;
  color: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [refreshKey]);

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis dataKey="label" stroke="#888" fontSize={12} />
            <YAxis
              tickFormatter={(v: number) => formatKRW(v)}
              stroke="#888"
              fontSize={12}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${formatKRW(Number(value))}원`, title]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
