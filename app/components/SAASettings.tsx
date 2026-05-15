"use client";

import { useState } from "react";
import type { SAATarget } from "@/lib/saa";

const PRESET_COLORS = [
  "#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#06b6d4",
  "#ec4899", "#eab308", "#6366f1", "#14b8a6", "#84cc16",
  "#a3a3a3", "#ef4444",
];

interface Props {
  targets: SAATarget[];
  onSave: () => void;
}

export default function SAASettings({ targets, onSave }: Props) {
  const [editing, setEditing] = useState<SAATarget | null>(null);
  const [adding, setAdding] = useState(false);

  const empty: SAATarget = {
    name: "",
    targetPercent: 0,
    band: 3,
    tickers: [],
    color: PRESET_COLORS[targets.length % PRESET_COLORS.length],
    cashFloor: 0,
  };

  async function handleSave(target: SAATarget, isNew: boolean) {
    await fetch("/api/saa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isNew ? "add" : "update",
        id: target.id,
        name: target.name,
        targetPercent: target.targetPercent,
        band: target.band,
        tickers: target.tickers,
        color: target.color,
        cashFloor: target.cashFloor,
      }),
    });
    setEditing(null);
    setAdding(false);
    onSave();
  }

  async function handleDelete(id: number) {
    await fetch("/api/saa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    onSave();
  }

  const totalPercent = targets.reduce((s, t) => s + t.targetPercent, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">목표 비중 설정</h3>
          <p className="text-sm text-muted-foreground">
            합계: {totalPercent}%{" "}
            {totalPercent !== 100 && (
              <span className="text-yellow-500">(100%가 아님)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(empty); }}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + 추가
        </button>
      </div>

      {/* Target list (편집 폼이 해당 항목 바로 아래에 인라인으로 표시됨) */}
      <div className="space-y-2">
        {targets.map((t) => (
          <div key={t.id} className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground ml-2">
                  {t.tickers.join(", ")}
                </span>
              </div>
              <span className="font-mono font-medium">{t.targetPercent}%</span>
              <span className="text-muted-foreground text-xs">±{t.band}%</span>
              {t.cashFloor ? (
                <span className="text-xs text-yellow-500">바닥 {t.cashFloor}%</span>
              ) : null}
              <button
                onClick={() => {
                  if (editing?.id === t.id) {
                    setEditing(null);
                    setAdding(false);
                  } else {
                    setEditing(t);
                    setAdding(false);
                  }
                }}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                {editing?.id === t.id ? "닫기" : "편집"}
              </button>
              <button
                onClick={() => t.id && handleDelete(t.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                삭제
              </button>
            </div>
            {/* 편집 폼을 선택된 항목 바로 아래에 렌더링 */}
            {editing && editing.id === t.id && !adding && (
              <TargetForm
                key={editing.id}
                target={editing}
                isNew={false}
                onSave={handleSave}
                onCancel={() => { setEditing(null); setAdding(false); }}
              />
            )}
          </div>
        ))}
        {targets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            아직 목표 비중이 없습니다. &quot;+ 추가&quot;를 눌러 설정하세요.
          </p>
        )}
      </div>

      {/* 새로 추가 폼은 목록 맨 아래에 표시 */}
      {adding && editing && (
        <TargetForm
          key="new"
          target={editing}
          isNew={true}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

function TargetForm({
  target,
  isNew,
  onSave,
  onCancel,
}: {
  target: SAATarget;
  isNew: boolean;
  onSave: (t: SAATarget, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(target.name);
  const [targetPercent, setTargetPercent] = useState(target.targetPercent);
  const [band, setBand] = useState(target.band);
  const [tickers, setTickers] = useState(target.tickers.join(", "));
  const [color, setColor] = useState(target.color);
  const [cashFloor, setCashFloor] = useState(target.cashFloor ?? 0);

  function submit() {
    onSave(
      {
        ...target,
        name,
        targetPercent,
        band,
        tickers: tickers.split(",").map((t) => t.trim()).filter(Boolean),
        color,
        cashFloor,
      },
      isNew
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="font-medium text-sm">{isNew ? "새 목표 추가" : "편집"}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">이름</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: ETH, 현금, Bucket A"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">매칭 티커 (콤마 구분)</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            placeholder="예: ETH, BTC, SCHD"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">목표 비중 (%)</label>
          <input
            type="number"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={targetPercent}
            onChange={(e) => setTargetPercent(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">허용 범위 ±(%)</label>
          <input
            type="number"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={band}
            onChange={(e) => setBand(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">현금 최소 비중 (현금일 때만)</label>
          <input
            type="number"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={cashFloor}
            onChange={(e) => setCashFloor(Number(e.target.value))}
            placeholder="0이면 현금 아님"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">색상</label>
          <div className="flex gap-1 flex-wrap mt-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={submit}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isNew ? "추가" : "저장"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted"
        >
          취소
        </button>
      </div>
    </div>
  );
}
