"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CryptoPosition } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";
import CategoryPicker, { Badge } from "./CategoryPicker";

const DEFAULT_CATEGORIES = ["Layer 1", "Layer 2", "DeFi", "스테이블코인", "밈", "기타"];

const EMPTY = { name: "", ticker: "", exchange: "", quantity: "", avg_price: "", current_price: "", value_krw: "", category: "기타" };

function formatKRW(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(v / 10_000).toLocaleString("ko-KR")}만`;
  return v.toLocaleString("ko-KR");
}

export default function CryptoTable({ crypto, month, onDataChanged }: { crypto: CryptoPosition[]; month?: string; onDataChanged?: () => void }) {
  const total = crypto.reduce((sum, c) => sum + c.valueKRW, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("crypto", month ?? "04", onDataChanged);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const [fetching, setFetching] = useState(false);
  const editable = !!month;

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...crypto.map((c) => c.category || "기타")]));

  const fetchPrice = useCallback(async (ticker: string, quantity: string) => {
    if (!ticker || !quantity || Number(quantity) === 0) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/price?type=crypto&ticker=${encodeURIComponent(ticker)}&quantity=${quantity}`);
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          current_price: String(data.price),
          value_krw: String(data.valueKRW),
        }));
      }
    } catch { /* ignore */ }
    finally { setFetching(false); }
  }, []);

  function startEdit(c: CryptoPosition) {
    setEditId(c.id!);
    setForm({ name: c.name, ticker: c.ticker, exchange: c.exchange, quantity: String(c.quantity), avg_price: c.avgPrice ? String(c.avgPrice) : "", current_price: String(c.currentPrice), value_krw: String(c.valueKRW), category: c.category || "기타" });
  }

  function saveForm(id?: number) {
    const vals = { ...form, quantity: Number(form.quantity), avg_price: form.avg_price ? Number(form.avg_price) : 0, current_price: Number(form.current_price), value_krw: Number(form.value_krw) };
    if (id) { updateRow(id, vals); setEditId(null); }
    else { addRow(vals); setShowAdd(false); }
    setForm(EMPTY);
  }

  function handleCategoryChange(cryptoId: number, newCategory: string) {
    updateRow(cryptoId, { category: newCategory });
  }

  const sorted = [...crypto].sort((a, b) => b.valueKRW - a.valueKRW);
  const groups = new Map<string, CryptoPosition[]>();
  for (const c of sorted) {
    const cat = c.category || "기타";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(c);
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
          <input className="w-full bg-muted/50 rounded px-2 py-1 text-sm" placeholder="자산명 (예: BTC)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </TableCell>
        <TableCell>
          <input className="w-full bg-muted/50 rounded px-2 py-1 text-xs" placeholder="CoinGecko ID (예: bitcoin)" value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            onBlur={() => fetchPrice(form.ticker, form.quantity)}
          />
        </TableCell>
        <TableCell>
          <input className="w-20 bg-muted/50 rounded px-2 py-1 text-xs" placeholder="거래소" value={form.exchange} onChange={(e) => setForm({ ...form, exchange: e.target.value })} />
        </TableCell>
        <TableCell>
          <input className="w-16 bg-muted/50 rounded px-2 py-1 text-sm text-right" placeholder="수량" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            onBlur={() => fetchPrice(form.ticker, form.quantity)}
          />
        </TableCell>
        <TableCell>
          <input className="w-24 bg-muted/50 rounded px-2 py-1 text-sm text-right" placeholder="매수가" value={form.avg_price}
            onChange={(e) => setForm({ ...form, avg_price: e.target.value })}
          />
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {fetching ? <span className="text-muted-foreground">조회중...</span> : form.current_price ? Number(form.current_price).toLocaleString("ko-KR") : "-"}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">-</TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {form.value_krw ? Number(form.value_krw).toLocaleString("ko-KR") : "-"}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">-</TableCell>
        <TableCell>
          <CategoryPicker value={form.category} onChange={(v) => setForm({ ...form, category: v })} allCategories={allCategories} />
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
          <span>암호화폐 포트폴리오</span>
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
              <TableHead>자산</TableHead>
              <TableHead>티커</TableHead>
              <TableHead>거래소</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">매수가(원)</TableHead>
              <TableHead className="text-right">현재가(원)</TableHead>
              <TableHead className="text-right">수익률</TableHead>
              <TableHead className="text-right">평가금(원)</TableHead>
              <TableHead className="text-right">전월 대비</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map(([category, positions]) =>
              positions.map((c, i) =>
                editId === c.id ? renderEditRow(`edit-${c.id}`, c.id) : (
                  <TableRow key={c.id ?? `${category}-${i}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.ticker}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{c.exchange}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{c.quantity.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {c.avgPrice > 0 ? c.avgPrice.toLocaleString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.currentPrice.toLocaleString("ko-KR")}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.avgPrice > 0 ? (() => {
                        const pnl = ((c.currentPrice - c.avgPrice) / c.avgPrice) * 100;
                        const cls = pnl >= 0 ? "text-emerald-400" : "text-red-400";
                        return <span className={cls}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%</span>;
                      })() : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{c.valueKRW.toLocaleString("ko-KR")}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.prevValueKRW != null ? (() => {
                        const diff = c.valueKRW - c.prevValueKRW;
                        const cls = diff >= 0 ? "text-emerald-400" : "text-red-400";
                        return <span className={cls}>{diff >= 0 ? "+" : "-"}{formatKRW(Math.abs(diff))}</span>;
                      })() : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <CategoryPicker
                          value={c.category || "기타"}
                          onChange={(v) => handleCategoryChange(c.id!, v)}
                          allCategories={allCategories}
                        />
                      ) : (
                        <Badge label={c.category || "기타"} />
                      )}
                    </TableCell>
                    <TableCell>
                      {editable && (
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(c)} className="text-xs text-muted-foreground hover:text-foreground">편집</button>
                          <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteRow(c.id!); }} className="text-xs text-red-400 hover:text-red-300">삭제</button>
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
        {editable && <p className="text-xs text-muted-foreground mt-2">CoinGecko ID와 수량 입력 후 탭/클릭하면 자동으로 현재가와 평가금이 계산됩니다 (예: bitcoin, ethereum, solana)</p>}
      </CardContent>
    </Card>
  );
}
