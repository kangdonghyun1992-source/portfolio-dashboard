"use client";

// Displays month-over-month change of a category total
// Green: 증가, Red: 감소, Gray: 변동 없음 또는 전월 데이터 없음
export default function MoMChange({
  current,
  prev,
  inverseColor = false, // true면 증가=빨강 (부채용)
}: {
  current: number;
  prev: number | undefined;
  inverseColor?: boolean;
}) {
  if (prev === undefined || prev === null) {
    return (
      <span className="text-xs text-muted-foreground">전월 데이터 없음</span>
    );
  }
  if (prev === 0 && current === 0) {
    return <span className="text-xs text-muted-foreground">0%</span>;
  }

  const diff = current - prev;
  const pct = prev === 0 ? null : (diff / prev) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;

  let colorClass = "text-muted-foreground";
  if (isUp) colorClass = inverseColor ? "text-red-400" : "text-emerald-400";
  else if (isDown) colorClass = inverseColor ? "text-emerald-400" : "text-red-400";

  const arrow = isUp ? "▲" : isDown ? "▼" : "•";
  const pctText = pct === null ? "신규" : `${Math.abs(pct).toFixed(1)}%`;
  const diffText = `${diff >= 0 ? "+" : "-"}${Math.abs(diff).toLocaleString("ko-KR")}원`;

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {arrow} {pctText} <span className="text-xs opacity-70">({diffText})</span>
    </span>
  );
}
