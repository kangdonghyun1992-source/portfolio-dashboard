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
  type PieLabelRenderProps,
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
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} 구성</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={(props: PieLabelRenderProps) => {
                const pct = props.percent
                  ? (Number(props.percent) * 100).toFixed(0)
                  : "0";
                return `${props.name ?? ""} ${pct}%`;
              }}
              labelLine={false}
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
      </CardContent>
    </Card>
  );
}

// Trend line chart for a specific category
export function CategoryTrendChart({
  dataKey,
  title,
  color,
}: {
  dataKey: string;
  title: string;
  color: string;
}) {
  const [data, setData] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

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
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
