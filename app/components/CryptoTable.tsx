"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CryptoPosition } from "@/lib/types";
import { useCrud } from "@/lib/use-crud";

const EMPTY = { name: "", ticker: "", exchange: "", quantity: "", current_price: "", value_krw: "" };

export default function CryptoTable({ crypto, month, onDataChanged }: { crypto: CryptoPosition[]; month?: string; onDataChanged?: () => void }) {
  const sorted = [...crypto].sort((a, b) => b.valueKRW - a.valueKRW);
  const total = sorted.reduce((sum, c) => sum + c.valueKRW, 0);
  const { saving, addRow, updateRow, deleteRow } = useCrud("crypto", month ?? "04", onDataChanged);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const [fetching, setFetching] = useState(false);
  const editable = !!month;

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
    setForm({ name: c.name, ticker: c.ticker, exchange: c.exchange, quantity: String(c.quantity), current_price: String(c.currentPrice), value_krw: String(c.valueKRW) });
  }

  function saveForm(id?: number) {
    const vals = { ...form, quantity: Number(form.quantity), current_price: Number(form.current_price), value_krw: Number(form.value_krw) };
    if (id) { updateRow(id, vals); setEditId(null); }
    else { addRow(vals); setShowAdd(false); }
    setForm(EMPTY);
  }

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
        <TableCell className="text-right text-sm tabular-nums">
          {fetching ? <span className="text-muted-foreground">조회중...</span> : form.current_price ? Number(form.current_price).toLocaleString("ko-KR") : "-"}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {form.value_krw ? Number(form.value_krw).toLocaleString("ko-KR") : "-"}
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
              <TableHead className="text-right">현재가(원)</TableHead>
              <TableHead className="text-right">평가금(원)</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) =>
              editId === c.id ? renderEditRow(`edit-${c.id}`, c.id) : (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.ticker}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{c.exchange}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{c.quantity.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.currentPrice.toLocaleString("ko-KR")}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{c.valueKRW.toLocaleString("ko-KR")}</TableCell>
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
            )}
            {showAdd && renderEditRow("add-new")}
          </TableBody>
        </Table>
        {editable && <p className="text-xs text-muted-foreground mt-2">CoinGecko ID와 수량 입력 후 탭/클릭하면 자동으로 현재가와 평가금이 계산됩니다 (예: bitcoin, ethereum, solana)</p>}
      </CardContent>
    </Card>
  );
}
