"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CashAsset } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

export default function CashTable({ cash, month, onDataChanged }: { cash: CashAsset[]; month: string; onDataChanged?: () => void }) {
  const total = cash.reduce((sum, c) => sum + c.amount, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("cash", month, onDataChanged);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ account: "", amount: "", note: "" });
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(c: CashAsset) {
    setEditId(c.id!);
    setForm({ account: c.account, amount: String(c.amount), note: c.note });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>현금성 자산</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-normal text-muted-foreground">총 {total.toLocaleString("ko-KR")}원</span>
            <button onClick={() => { setShowAdd(true); setForm({ account: "", amount: "", note: "" }); }} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">+ 추가</button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>계좌</TableHead>
              <TableHead>비고</TableHead>
              <TableHead className="text-right">금액(원)</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cash.map((c) =>
              editId === c.id ? (
                <TableRow key={c.id}>
                  <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></TableCell>
                  <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></TableCell>
                  <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm text-right" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => { updateRow(c.id!, form); setEditId(null); }} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">저장</button>
                      <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{c.account}</TableCell>
                  <TableCell className="text-muted-foreground">{c.note}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{c.amount.toLocaleString("ko-KR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(c)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                      <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteRow(c.id!); }} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
            {showAdd && (
              <TableRow>
                <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="계좌명" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></TableCell>
                <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="비고" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></TableCell>
                <TableCell><input className="w-full bg-muted/50 rounded px-2 py-1 text-sm text-right" placeholder="금액" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => { addRow(form); setShowAdd(false); }} disabled={saving} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">추가</button>
                    <button onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
