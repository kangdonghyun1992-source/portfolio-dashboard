"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Liability } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

const EMPTY = { name: "", amount: "", rate: "", note: "" };

type LiabilityChange = (
  key: "liabilities",
  action: "add" | "update" | "delete",
  row: Partial<Liability> & { id: number }
) => void;

export default function LiabilityCard({ liabilities, month, onChange }: { liabilities: Liability[]; month?: string; onChange?: LiabilityChange }) {
  const total = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("liabilities", month ?? "04");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const editable = !!month;

  function startEdit(l: Liability) {
    setEditId(l.id!);
    setForm({ name: l.name, amount: String(l.amount), rate: String(l.rate), note: l.note });
  }

  async function handleSave(id: number) {
    const vals = { ...form, amount: Number(form.amount), rate: Number(form.rate) };
    const row: Omit<Liability, "id"> = { name: form.name, amount: Number(form.amount) || 0, rate: Number(form.rate) || 0, note: form.note };
    setEditId(null);
    const ok = await updateRow(id, vals);
    if (ok) onChange?.("liabilities", "update", { ...row, id });
  }

  async function handleAdd() {
    const vals = { ...form, amount: Number(form.amount), rate: Number(form.rate) };
    const row: Omit<Liability, "id"> = { name: form.name, amount: Number(form.amount) || 0, rate: Number(form.rate) || 0, note: form.note };
    setShowAdd(false);
    setForm(EMPTY);
    const newId = await addRow(vals);
    if (newId != null) onChange?.("liabilities", "add", { ...row, id: newId });
  }

  async function handleDelete(id: number) {
    if (!confirm("삭제하시겠습니까?")) return;
    const ok = await deleteRow(id);
    if (ok) onChange?.("liabilities", "delete", { id });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>부채</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-normal text-red-400">총 {total.toLocaleString("ko-KR")}원</span>
            {editable && <button onClick={() => { setShowAdd(true); setForm(EMPTY); }} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">+ 추가</button>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...liabilities].sort((a, b) => b.amount - a.amount).map((l) =>
          editId === l.id ? (
            <div key={l.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="부채명" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="이자율 (%)" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="비고" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <div className="flex gap-1">
                <button onClick={() => handleSave(l.id!)} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">저장</button>
                <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
              </div>
            </div>
          ) : (
            <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-muted-foreground">{l.note} · 이자율 {l.rate}%</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-red-400">{l.amount.toLocaleString("ko-KR")}원</p>
                {editable && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(l)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                    <button onClick={() => handleDelete(l.id!)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {showAdd && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="부채명" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="이자율 (%)" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="비고" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
