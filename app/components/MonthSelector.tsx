"use client";

import { useState } from "react";

const MONTHS = [
  { value: "01", label: "2026년 1월" },
  { value: "02", label: "2026년 2월" },
  { value: "03", label: "2026년 3월" },
  { value: "04", label: "2026년 4월" },
  { value: "05", label: "2026년 5월" },
  { value: "06", label: "2026년 6월" },
];

export default function MonthSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function createNewMonth() {
    const nextMonth = String(parseInt(value) + 1).padStart(2, "0");
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/portfolio/new-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: nextMonth }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${nextMonth}월 시트 생성 완료`);
        onChange(nextMonth);
      } else {
        setMessage(data.error || "오류 발생");
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-xs text-emerald-400">{message}</span>
      )}
      <button
        onClick={createNewMonth}
        disabled={creating}
        className="text-xs px-3 py-2 rounded-lg border border-input bg-transparent hover:bg-muted disabled:opacity-50"
        title="전월 데이터를 복사해서 다음 월 시트를 생성합니다"
      >
        {creating ? "생성 중..." : "+ 새 월"}
      </button>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
