"use client";

import type { Summary } from "@/lib/types";

function formatKRW(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  return value.toLocaleString("ko-KR");
}

function Delta({
  current,
  prev,
  inverseColor = false,
}: {
  current: number;
  prev?: number;
  inverseColor?: boolean;
}) {
  if (prev === undefined || prev === null) {
    return <span className="text-[11px] text-muted-foreground">신규</span>;
  }
  const diff = current - prev;
  if (diff === 0 && prev === 0) return null;
  const pct = prev === 0 ? null : (diff / prev) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;
  let colorClass = "text-muted-foreground";
  if (isUp) colorClass = inverseColor ? "text-red-400" : "text-emerald-400";
  else if (isDown) colorClass = inverseColor ? "text-emerald-400" : "text-red-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "•";
  const sign = diff >= 0 ? "+" : "-";
  return (
    <span className={`flex items-baseline gap-1 text-xs ${colorClass}`}>
      <span>
        {arrow}
        {sign}
        {formatKRW(Math.abs(diff))}
      </span>
      {pct !== null && (
        <span className="opacity-70">({Math.abs(pct).toFixed(1)}%)</span>
      )}
    </span>
  );
}

function Stat({
  label,
  valueNode,
  current,
  prev,
  inverseColor = false,
}: {
  label: string;
  valueNode: React.ReactNode;
  current: number;
  prev?: number;
  inverseColor?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2 flex-wrap">
        {valueNode}
        <Delta current={current} prev={prev} inverseColor={inverseColor} />
      </div>
    </div>
  );
}

export default function SummaryCards({
  summary,
  pensionTotal,
  prevPensionTotal,
}: {
  summary: Summary;
  pensionTotal: number;
  prevPensionTotal?: number;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-3 px-4 py-3 rounded-xl bg-card border">
      <Stat
        label="총자산"
        valueNode={<span className="font-semibold">{formatKRW(summary.totalAssets)}</span>}
        current={summary.totalAssets}
        prev={summary.prevTotalAssets}
      />
      <div className="w-px h-10 bg-border self-center" />
      <Stat
        label="부채"
        valueNode={<span className="font-semibold text-red-400">{formatKRW(summary.totalLiabilities)}</span>}
        current={summary.totalLiabilities}
        prev={summary.prevLiabilityTotal}
        inverseColor
      />
      <div className="w-px h-10 bg-border self-center" />
      <Stat
        label="순자산"
        valueNode={<span className="text-xl font-bold text-emerald-400">{formatKRW(summary.netWorth)}</span>}
        current={summary.netWorth}
        prev={summary.prevNetWorth}
      />
      <div className="w-px h-10 bg-border self-center" />
      <Stat
        label="연금"
        valueNode={<span className="font-semibold">{formatKRW(pensionTotal)}</span>}
        current={pensionTotal}
        prev={prevPensionTotal}
      />
    </div>
  );
}
