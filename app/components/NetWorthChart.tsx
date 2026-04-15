"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryPoint {
  month: string;
  label: string;
  totalAssets: number;
  netWorth: number;
}

function formatAxis(v: number): string {
  return `${(v / 100_000_000).toFixed(1)}억`;
}

export default function NetWorthChart() {
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
        <CardTitle>순자산 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="label"
              stroke="#888"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatAxis}
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
              formatter={(value, name) => [
                `${(Number(value) / 100_000_000).toFixed(2)}억원`,
                name === "netWorth" ? "순자산" : "총자산",
              ]}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ fill: "#34d399", r: 4 }}
              name="netWorth"
            />
            <Line
              type="monotone"
              dataKey="totalAssets"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: "#60a5fa", r: 4 }}
              strokeDasharray="5 5"
              name="totalAssets"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-6 justify-center mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-emerald-400" />
            순자산
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-400 border-dashed" />
            총자산
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
