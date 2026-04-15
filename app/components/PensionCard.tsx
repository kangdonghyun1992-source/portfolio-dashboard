"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PensionAccount } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

const EMPTY = { institution: "", type: "", amount: "" };

export default function PensionCard({ pension, month, onDataChanged }: { pension: PensionAccount[]; month?: string; onDataChanged?: () => void }) {
  const total = pension.reduce((sum, p) => sum + p.amount, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("pension", month ?? "04", onDataChanged);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const editable = !!month;

  function startEdit(p: PensionAccount) {
    setEditId(p.id!);
    setForm({ institution: p.institution, type: p.type, amount: String(p.amount) });
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
        {pension.map((p) =>
          editId === p.id ? (
            <div key={p.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="기관" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="유형" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <div className="flex gap-1">
                <button onClick={() => { updateRow(p.id!, { ...form, amount: Number(form.amount) }); setEditId(null); }} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">저장</button>
                <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
              </div>
            </div>
          ) : (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">{p.institution}</p>
                <p className="text-sm text-muted-foreground">{p.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold">{p.amount.toLocaleString("ko-KR")}원</p>
                {editable && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                    <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteRow(p.id!); }} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {showAdd && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="기관" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="유형" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <div className="flex gap-1">
              <button onClick={() => { addRow({ ...form, amount: Number(form.amount) }); setShowAdd(false); setForm(EMPTY); }} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">추가</button>
              <button onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
