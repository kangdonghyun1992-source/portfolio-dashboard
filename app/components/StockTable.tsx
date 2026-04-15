"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockPosition } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

const CATEGORY_COLORS: Record<string, string> = {
  "Bucket A": "bg-blue-500/20 text-blue-400",
  "Bucket B": "bg-purple-500/20 text-purple-400",
  "매크로 헤지": "bg-amber-500/20 text-amber-400",
  위성: "bg-cyan-500/20 text-cyan-400",
  Scout: "bg-green-500/20 text-green-400",
  두나무: "bg-pink-500/20 text-pink-400",
  BN: "bg-indigo-500/20 text-indigo-400",
  "적립(비투자)": "bg-gray-500/20 text-gray-400",
};

function Badge({ label }: { label: string }) {
  const color = CATEGORY_COLORS[label] ?? "bg-muted text-muted-foreground";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

const EMPTY = { platform: "토스증권", name: "", ticker: "", quantity: "", current_price: "", value_usd: "", value_krw: "", category: "기타", currency: "USD" };

export default function StockTable({ stocks, month, onDataChanged }: { stocks: StockPosition[]; month?: string; onDataChanged?: () => void }) {
  const total = stocks.reduce((sum, s) => sum + s.valueKRW, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("stocks", month ?? "04", onDataChanged);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const [fetching, setFetching] = useState(false);
  const editable = !!month;

  const fetchPrice = useCallback(async (ticker: string, quantity: string) => {
    if (!ticker || !quantity || Number(quantity) === 0) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/price?type=stock&ticker=${encodeURIComponent(ticker)}&quantity=${quantity}`);
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          current_price: String(data.price),
          value_usd: data.valueUSD != null ? String(Math.round(data.valueUSD * 100) / 100) : "",
          value_krw: String(data.valueKRW),
          currency: data.currency ?? "USD",
        }));
      }
    } catch { /* ignore */ }
    finally { setFetching(false); }
  }, []);

  function startEdit(s: StockPosition) {
    setEditId(s.id!);
    setForm({ platform: s.platform, name: s.name, ticker: s.ticker, quantity: String(s.quantity), current_price: String(s.currentPrice), value_usd: s.valueUSD != null ? String(s.valueUSD) : "", value_krw: String(s.valueKRW), category: s.category, currency: s.currency });
  }

  function saveForm(id?: number) {
    const vals = { ...form, quantity: Number(form.quantity), current_price: Number(form.current_price), value_usd: form.value_usd ? Number(form.value_usd) : null, value_krw: Number(form.value_krw), domestic: form.currency === "KRW" ? 1 : 0 };
    if (id) { updateRow(id, vals as Record<string, string | number>); setEditId(null); }
    else { addRow(vals as Record<string, string | number>); setShowAdd(false); }
    setForm(EMPTY);
  }

  const sorted = [...stocks].sort((a, b) => b.valueKRW - a.valueKRW);
  const groups = new Map<string, StockPosition[]>();
  for (const s of sorted) {
    const cat = s.category || "기타";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    const totalA = a[1].reduce((s, p) => s + p.valueKRW, 0);
    const totalB = b[1].reduce((s, p) => s + p.valueKRW, 0);
    return totalB - totalA;
  });

  function renderEditRow(key: string, id?: number) {
    return (
      <TableRow key={key}>
        <TableCell>
          <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="종목명" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </TableCell>
        <TableCell>
          <input className="w-full bg-muted/50 rounded px-2 py-1 text-xs" placeholder="티커 (예: AAPL)" value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            onBlur={() => fetchPrice(form.ticker, form.quantity)}
          />
        </TableCell>
        <TableCell>
          <input className="w-16 bg-muted/50 rounded px-2 py-1 text-sm text-right" placeholder="수량" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            onBlur={() => fetchPrice(form.ticker, form.quantity)}
          />
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {fetching ? <span className="text-muted-foreground">조회중...</span> : form.current_price ? `$${Number(form.current_price).toLocaleString("en-US")}` : "-"}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {form.value_krw ? Number(form.value_krw).toLocaleString("ko-KR") : "-"}
        </TableCell>
        <TableCell>
          <input className="w-20 bg-muted/50 rounded px-2 py-1 text-xs" placeholder="카테고리" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <button onClick={() => saveForm(id)} disabled={saving || fetching} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">저장</button>
            <button onClick={() => { setEditId(null); setShowAdd(false); }} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">취소</button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>주식 포트폴리오</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-normal text-muted-foreground">총 {total.toLocaleString("ko-KR")}원</span>
            {editable && <button onClick={() => { setShowAdd(true); setForm(EMPTY); }} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80">+ 추가</button>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종목</TableHead>
              <TableHead>티커</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead className="text-right">평가금(원)</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map(([category, positions]) =>
              positions.map((s, i) =>
                editId === s.id ? renderEditRow(`edit-${s.id}`, s.id) : (
                  <TableRow key={s.id ?? `${category}-${i}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.ticker}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.currency === "USD" ? "$" : ""}{s.currentPrice.toLocaleString("ko-KR")}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{s.valueKRW.toLocaleString("ko-KR")}</TableCell>
                    <TableCell>{i === 0 && <Badge label={category} />}</TableCell>
                    <TableCell>
                      {editable && (
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(s)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                          <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteRow(s.id!); }} className="text-xs text-red-400 hover:text-red-300">삭제</button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )
            )}
            {showAdd && renderEditRow("add-new")}
          </TableBody>
        </Table>
        {editable && <p className="text-xs text-muted-foreground mt-2">티커와 수량 입력 후 탭/클릭하면 자동으로 현재가와 평가금이 계산됩니다</p>}
      </CardContent>
    </Card>
  );
}
