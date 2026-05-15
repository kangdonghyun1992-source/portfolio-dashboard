"use client";

import { useState, useEffect, useCallback } from "react";

function monthLabel(value: string): string {
  return `2026년 ${parseInt(value)}월`;
}

export default function MonthSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const fetchMonths = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/months");
      if (!res.ok) return;
      const data = (await res.json()) as string[];
      // data: ["2026-01", "2026-03", ...] → ["01", "03", ...]
      const values = data.map((m) => m.split("-")[1]).filter(Boolean);
      setAvailableMonths(values);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  // Always include the currently-selected value so the select has a valid option
  const options = Array.from(new Set([...availableMonths, value]))
    .filter(Boolean)
    .sort((a, b) => parseInt(a) - parseInt(b));

  async function createNewMonth() {
    const nextMonth = String(parseInt(value) + 1).padStart(2, "0");
    if (parseInt(nextMonth) > 12) return;
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
        setMessage(`${parseInt(nextMonth)}월 생성 완료`);
        await fetchMonths();
        onChange(nextMonth);
      } else {
        setMessage(data.error || "오류 발생");
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function deleteCurrentMonth() {
    if (!confirm(`${monthLabel(value)}의 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    setMessage("");
    try {
      const res = await fetch("/api/portfolio/delete-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: value }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${parseInt(value)}월 삭제 완료`);
        // Refresh the month list and pick the latest remaining month
        const res2 = await fetch("/api/portfolio/months");
        const months = res2.ok ? ((await res2.json()) as string[]) : [];
        const remaining = months.map((m) => m.split("-")[1]).filter((m) => m && m !== value);
        setAvailableMonths(remaining);
        const fallback = remaining.length > 0 ? remaining[remaining.length - 1] : "04";
        onChange(fallback);
      } else {
        setMessage(data.error || "오류 발생");
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-xs text-emerald-400">{message}</span>
      )}
      <button
        onClick={createNewMonth}
        disabled={creating || parseInt(value) >= 12}
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
        {options.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
      <button
        onClick={deleteCurrentMonth}
        disabled={deleting}
        className="text-xs px-2 py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50 disabled:opacity-50"
        title="현재 월의 모든 데이터를 삭제합니다"
      >
        {deleting ? "삭제 중..." : "🗑"}
      </button>
    </div>
  );
}
