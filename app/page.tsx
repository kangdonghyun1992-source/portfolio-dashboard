"use client";

import { useEffect, useState, useCallback } from "react";
import type { PortfolioData } from "@/lib/types";
import SummaryCards from "./components/SummaryCards";
import AllocationChart from "./components/AllocationChart";
import StockTable from "./components/StockTable";
import CryptoTable from "./components/CryptoTable";
import CashTable from "./components/CashTable";
import LiabilityCard from "./components/LiabilityCard";
import PensionCard from "./components/PensionCard";
import MonthSelector from "./components/MonthSelector";
import CategoryTabs, { type TabId } from "./components/CategoryTabs";
import SAAChart from "./components/SAAChart";
import NetWorthChart from "./components/NetWorthChart";
import { SubPieChart, CategoryTrendChart } from "./components/CategoryCharts";
import { calculateSAA } from "@/lib/saa";

const STOCK_CATEGORY_COLORS: Record<string, string> = {
  "Bucket A": "#3b82f6",
  "Bucket B": "#8b5cf6",
  "매크로 헤지": "#eab308",
  위성: "#06b6d4",
  Scout: "#22c55e",
  두나무: "#ec4899",
  BN: "#6366f1",
  "적립(비투자)": "#737373",
};

export default function Home() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [month, setMonth] = useState("04");
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio?month=${month}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch");
      }
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helpers for sub-pie data
  function stockPieData() {
    if (!data) return [];
    const groups = new Map<string, number>();
    for (const s of data.stocks) {
      const cat = s.category || "기타";
      groups.set(cat, (groups.get(cat) ?? 0) + s.valueKRW);
    }
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const result: { name: string; value: number; color: string }[] = [];
    let otherTotal = 0;
    sorted.forEach(([name, value]) => {
      if (value / total > 0.03) {
        result.push({ name, value, color: STOCK_CATEGORY_COLORS[name] ?? "#737373" });
      } else {
        otherTotal += value;
      }
    });
    if (otherTotal > 0) result.push({ name: "기타", value: otherTotal, color: "#737373" });
    return result;
  }

  function cryptoPieData() {
    if (!data) return [];
    const groups = new Map<string, number>();
    for (const c of data.crypto) {
      groups.set(c.name, (groups.get(c.name) ?? 0) + c.valueKRW);
    }
    const colors = ["#f97316", "#818cf8", "#06b6d4", "#22c55e", "#eab308", "#ec4899"];
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const result: { name: string; value: number; color: string }[] = [];
    let otherTotal = 0;
    sorted.forEach(([name, value], i) => {
      if (i < 5 && value / total > 0.03) {
        result.push({ name, value, color: colors[i] });
      } else {
        otherTotal += value;
      }
    });
    if (otherTotal > 0) result.push({ name: "기타", value: otherTotal, color: "#737373" });
    return result;
  }

  function cashPieData() {
    if (!data) return [];
    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];
    const sorted = [...data.cash].filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((s, c) => s + c.amount, 0);
    const result: { name: string; value: number; color: string }[] = [];
    let otherTotal = 0;
    sorted.forEach((c, i) => {
      if (i < 4 && c.amount / total > 0.05) {
        result.push({ name: c.account, value: c.amount, color: colors[i] });
      } else {
        otherTotal += c.amount;
      }
    });
    if (otherTotal > 0) {
      result.push({ name: "기타", value: otherTotal, color: "#737373" });
    }
    return result;
  }

  function pensionPieData() {
    if (!data) return [];
    const colors = ["#ec4899", "#f472b6"];
    return data.pension.map((p, i) => ({
      name: p.institution,
      value: p.amount,
      color: colors[i % colors.length],
    }));
  }

  const pensionTotal = data?.pension.reduce((s, p) => s + p.amount, 0) ?? 0;

  const isEmpty =
    data &&
    data.cash.length === 0 &&
    data.stocks.length === 0 &&
    data.crypto.length === 0 &&
    data.pension.length === 0 &&
    data.realEstate.length === 0 &&
    data.liabilities.length === 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
          <span className="ml-3 text-muted-foreground">
            데이터를 불러오는 중...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-300">
          <p className="font-medium">오류 발생</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && !loading && isEmpty && (
        <div className="rounded-xl border bg-card p-8 shadow-sm max-w-lg mx-auto text-center space-y-4">
          <p className="text-4xl">&#127881;</p>
          <h2 className="text-xl font-bold">자산관리 대시보드에 오신 걸 환영합니다!</h2>
          <p className="text-muted-foreground">
            아직 데이터가 없습니다. 시작하려면:
          </p>
          <ol className="text-left text-sm text-muted-foreground space-y-2 pl-6 list-decimal">
            <li>아래 탭에서 카테고리를 선택하세요</li>
            <li><strong className="text-foreground">&quot;+ 추가&quot;</strong> 버튼으로 자산을 등록하세요</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            현금, 주식, 크립토, 연금, 부동산, 부채를 모두 관리할 수 있습니다.
          </p>
          <CategoryTabs active={tab} onChange={setTab} />
          {tab === "cash" && <CashTable cash={data.cash} month={month} onDataChanged={fetchData} />}
          {tab === "stocks" && <StockTable stocks={data.stocks} month={month} onDataChanged={fetchData} />}
          {tab === "crypto" && <CryptoTable crypto={data.crypto} month={month} onDataChanged={fetchData} />}
          {tab === "pension" && <PensionCard pension={data.pension} month={month} onDataChanged={fetchData} />}
          {tab === "debt" && <LiabilityCard liabilities={data.liabilities} month={month} onDataChanged={fetchData} />}
        </div>
      )}

      {data && !loading && !isEmpty && (
        <>
          <SummaryCards summary={data.summary} pensionTotal={pensionTotal} />
          <CategoryTabs active={tab} onChange={setTab} />

          {/* 전체 탭: 순자산 추이 + 파이차트 + 리밸런싱 현황 */}
          {tab === "overview" && (
            <div className="space-y-6">
              <NetWorthChart />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AllocationChart allocation={data.allocation} />
                <SAAChart
                  results={calculateSAA(
                    data.stocks,
                    data.crypto,
                    data.cash.reduce((s, c) => s + c.amount, 0)
                  )}
                />
              </div>
            </div>
          )}

          {/* 현금 탭 */}
          {tab === "cash" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={cashPieData()} title="현금" />
                <CategoryTrendChart dataKey="cash" title="현금" color="#22c55e" />
              </div>
              <CashTable cash={data.cash} month={month} onDataChanged={fetchData} />
            </div>
          )}

          {/* 주식 탭 */}
          {tab === "stocks" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={stockPieData()} title="주식" />
                <CategoryTrendChart dataKey="stocks" title="주식" color="#3b82f6" />
              </div>
              <StockTable stocks={data.stocks} month={month} onDataChanged={fetchData} />
            </div>
          )}

          {/* 크립토 탭 */}
          {tab === "crypto" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={cryptoPieData()} title="크립토" />
                <CategoryTrendChart dataKey="crypto" title="크립토" color="#f59e0b" />
              </div>
              <CryptoTable crypto={data.crypto} month={month} onDataChanged={fetchData} />
            </div>
          )}

          {/* 연금 탭 */}
          {tab === "pension" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={pensionPieData()} title="연금" />
                <CategoryTrendChart dataKey="pension" title="연금" color="#ec4899" />
              </div>
              <PensionCard pension={data.pension} month={month} onDataChanged={fetchData} />
            </div>
          )}

          {/* 부동산 탭 */}
          {tab === "property" && (
            <div className="space-y-6">
              <CategoryTrendChart dataKey="realEstate" title="부동산" color="#8b5cf6" />
              {data.realEstate.map((re) => (
                <div
                  key={re.id}
                  className="rounded-xl border bg-card p-6 shadow-sm"
                >
                  <p className="text-sm text-muted-foreground">부동산</p>
                  <p className="text-2xl font-bold mt-1">
                    {re.amount.toLocaleString("ko-KR")}원
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {re.name} · {re.note}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 부채 탭 */}
          {tab === "debt" && <LiabilityCard liabilities={data.liabilities} month={month} onDataChanged={fetchData} />}
        </>
      )}
    </main>
  );
}
