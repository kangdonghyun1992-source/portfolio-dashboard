"use client";

import type { Summary } from "@/lib/types";

function formatKRW(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  return value.toLocaleString("ko-KR");
}

function Delta({ current, prev }: { current: number; prev?: number }) {
  if (!prev || prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
      {isUp ? "▲" : "▼"}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function SummaryCards({
  summary,
  pensionTotal,
}: {
  summary: Summary;
  pensionTotal: number;
}) {
  return (
    <div className="flex items-center gap-6 px-4 py-3 rounded-xl bg-card border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">총자산</span>
        <span className="font-semibold">{formatKRW(summary.totalAssets)}</span>
        <Delta current={summary.totalAssets} prev={summary.prevTotalAssets} />
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">부채</span>
        <span className="font-semibold text-red-400">{formatKRW(summary.totalLiabilities)}</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">순자산</span>
        <span className="text-xl font-bold text-emerald-400">{formatKRW(summary.netWorth)}</span>
        <Delta current={summary.netWorth} prev={summary.prevNetWorth} />
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">연금</span>
        <span className="font-semibold">{formatKRW(pensionTotal)}</span>
      </div>
    </div>
  );
}
