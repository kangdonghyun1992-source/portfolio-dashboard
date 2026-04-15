"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SAAResult } from "@/lib/saa";

function StatusIcon({ status }: { status: "ok" | "warning" | "danger" }) {
  if (status === "ok") return <span className="text-emerald-400">&#10003;</span>;
  if (status === "warning") return <span className="text-amber-400">&#9888;</span>;
  return <span className="text-red-400">&#10007;</span>;
}

function formatAmount(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 10_000).toFixed(0)}만`;
  return v.toLocaleString("ko-KR");
}

export default function SAAChart({ results }: { results: SAAResult[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>리밸런싱 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((r) => {
          const maxPercent = Math.max(r.targetPercent + r.band, r.currentPercent, 40);
          const targetLeft = (r.targetPercent / maxPercent) * 100;
          const currentWidth = (r.currentPercent / maxPercent) * 100;
          const bandMin = Math.max(0, ((r.targetPercent - r.band) / maxPercent) * 100);
          const bandMax = ((r.targetPercent + r.band) / maxPercent) * 100;

          return (
            <div key={r.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <StatusIcon status={r.status} />
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    목표 {r.targetPercent}%
                  </span>
                  <span
                    className={
                      r.status === "danger"
                        ? "text-red-400 font-semibold"
                        : r.status === "warning"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }
                  >
                    현재 {r.currentPercent}%
                  </span>
                  <span className="text-muted-foreground w-20 text-right">
                    {r.rebalanceAmount > 0 ? "+" : ""}
                    {formatAmount(r.rebalanceAmount)}원
                  </span>
                </div>
              </div>
              {/* Bar chart */}
              <div className="relative h-5 rounded-full bg-muted/30 overflow-hidden">
                {/* Band range (faint) */}
                <div
                  className="absolute inset-y-0 bg-white/5 rounded-full"
                  style={{ left: `${bandMin}%`, width: `${bandMax - bandMin}%` }}
                />
                {/* Current bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${currentWidth}%`,
                    backgroundColor: r.color,
                    opacity: 0.7,
                  }}
                />
                {/* Target line */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white/60"
                  style={{ left: `${targetLeft}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
