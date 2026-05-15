"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PensionAccount } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

const EMPTY = { institution: "", type: "", amount: "" };

const DEFAULT_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
];

type PensionChange = (
  key: "pension",
  action: "add" | "update" | "delete",
  row: Partial<PensionAccount> & { id: number }
) => void;

export default function PensionCard({
  pension,
  month,
  onChange,
  colors = DEFAULT_COLORS,
}: {
  pension: PensionAccount[];
  month?: string;
  onChange?: PensionChange;
  colors?: string[];
}) {
  const total = pension.reduce((sum, p) => sum + p.amount, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("pension", month ?? "04");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const editable = !!month;

  function startEdit(p: PensionAccount) {
    setEditId(p.id!);
    setForm({ institution: p.institution, type: p.type, amount: String(p.amount) });
  }

  async function handleSave(id: number) {
    const vals = { ...form, amount: Number(form.amount) };
    const row: Omit<PensionAccount, "id"> = { institution: form.institution, type: form.type, amount: Number(form.amount) || 0 };
    setEditId(null);
    const ok = await updateRow(id, vals);
    if (ok) onChange?.("pension", "update", { ...row, id });
  }

  async function handleAdd() {
    const vals = { ...form, amount: Number(form.amount) };
    const row: Omit<PensionAccount, "id"> = { institution: form.institution, type: form.type, amount: Number(form.amount) || 0 };
    setShowAdd(false);
    setForm(EMPTY);
    const newId = await addRow(vals);
    if (newId != null) onChange?.("pension", "add", { ...row, id: newId });
  }

  async function handleDelete(id: number) {
    if (!confirm("삭제하시겠습니까?")) return;
    const ok = await deleteRow(id);
    if (ok) onChange?.("pension", "delete", { id });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>연금</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-normal text-muted-foreground">총 {total.toLocaleString("ko-KR")}원</span>
            {editable && <button onClick={() => { setShowAdd(true); setForm(EMPTY); }} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">+ 추가</button>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...pension].sort((a, b) => b.amount - a.amount).map((p, i) => {
          const color = colors[i % colors.length];
          const share = total > 0 ? (p.amount / total) * 100 : 0;
          return editId === p.id ? (
            <div
              key={p.id}
              className="p-3 rounded-lg bg-muted/30 space-y-2 border-l-4"
              style={{ borderLeftColor: color }}
            >
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="기관" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="유형" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <div className="flex gap-1">
                <button onClick={() => handleSave(p.id!)} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">저장</button>
                <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors"
              style={{
                borderLeftColor: color,
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.institution}</p>
                  <p className="text-sm text-muted-foreground truncate">{p.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums">{p.amount.toLocaleString("ko-KR")}원</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{share.toFixed(1)}%</p>
                </div>
                {editable && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                    <button onClick={() => handleDelete(p.id!)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {showAdd && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="기관" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="유형" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <div className="flex gap-1">
              <button onClick={handleAdd} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">추가</button>
              <button onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
