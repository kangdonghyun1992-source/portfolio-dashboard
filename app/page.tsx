"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type {
  PortfolioData,
  CashAsset,
  StockPosition,
  CryptoPosition,
  Liability,
  PensionAccount,
  RealEstate,
} from "@/lib/types";
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
import SAASettings from "./components/SAASettings";
import ThemeToggle from "./components/ThemeToggle";
import MoMChange from "./components/MoMChange";
import { calculateSAA, type SAATarget } from "@/lib/saa";

function CategoryHeader({
  title,
  current,
  prev,
  inverseColor = false,
}: {
  title: string;
  current: number;
  prev: number | undefined;
  inverseColor?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xl font-bold mt-0.5">{current.toLocaleString("ko-KR")}원</p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground">전월 대비</span>
        <MoMChange current={current} prev={prev} inverseColor={inverseColor} />
      </div>
    </div>
  );
}

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [month, setMonth] = useState("04");
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saaTargets, setSaaTargets] = useState<SAATarget[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSAA = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/saa");
      if (res.ok) {
        const json = await res.json();
        setSaaTargets(json);
      }
    } catch { /* ignore */ }
  }, [status]);

  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;
    // 첫 로드만 전체 스피너; 월 변경 시엔 기존 데이터 유지하며 조용히 갱신
    if (!hasLoadedRef.current) setLoading(true);
    setError(null);
    try {
      const [res] = await Promise.all([
        fetch(`/api/portfolio?month=${month}`),
        fetchSAA(),
      ]);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch");
      }
      const json = await res.json();
      setData(json);
      hasLoadedRef.current = true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [month, status, fetchSAA]);

  // 행 1개 추가/수정/삭제 후 전체 재조회 대신 로컬 state만 갱신.
  // 합계(summary/allocation)는 행 합으로 재계산.
  const applyChange = useCallback(
    <K extends "cash" | "stocks" | "crypto" | "liabilities" | "pension" | "realEstate">(
      key: K,
      action: "add" | "update" | "delete",
      row: { id: number } & Partial<
        CashAsset & StockPosition & CryptoPosition & Liability & PensionAccount & RealEstate
      >
    ) => {
      setData((prev) => {
        if (!prev) return prev;
        const arr = prev[key] as Array<{ id?: number }>;
        let nextArr: Array<{ id?: number }>;
        if (action === "add") nextArr = [...arr, row];
        else if (action === "update")
          nextArr = arr.map((r) => (r.id === row.id ? { ...r, ...row } : r));
        else nextArr = arr.filter((r) => r.id !== row.id);

        const next: PortfolioData = { ...prev, [key]: nextArr } as PortfolioData;
        const cashTotal = next.cash.reduce((s, c) => s + c.amount, 0);
        const stockTotal = next.stocks.reduce((s, p) => s + p.valueKRW, 0);
        const cryptoTotal = next.crypto.reduce((s, c) => s + c.valueKRW, 0);
        const realEstateTotal = next.realEstate.reduce((s, r) => s + r.amount, 0);
        const liabilityTotal = next.liabilities.reduce((s, l) => s + l.amount, 0);
        const totalAssets = cashTotal + stockTotal + cryptoTotal + realEstateTotal;
        const netWorth = totalAssets - liabilityTotal;

        next.summary = {
          ...next.summary,
          totalAssets,
          totalLiabilities: liabilityTotal,
          netWorth,
        };
        next.allocation = [
          { category: "현금", amount: cashTotal, percent: totalAssets > 0 ? Math.round((cashTotal / totalAssets) * 1000) / 10 : 0, color: "#22c55e" },
          { category: "주식", amount: stockTotal, percent: totalAssets > 0 ? Math.round((stockTotal / totalAssets) * 1000) / 10 : 0, color: "#3b82f6" },
          { category: "암호화폐", amount: cryptoTotal, percent: totalAssets > 0 ? Math.round((cryptoTotal / totalAssets) * 1000) / 10 : 0, color: "#f59e0b" },
          { category: "부동산", amount: realEstateTotal, percent: totalAssets > 0 ? Math.round((realEstateTotal / totalAssets) * 1000) / 10 : 0, color: "#8b5cf6" },
        ];
        return next;
      });
      // 차트(NetWorthChart, CategoryTrendChart)가 history API를 다시 가져오도록 트리거
      setHistoryKey((k) => k + 1);
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </main>
    );
  }

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

  const CRYPTO_CATEGORY_COLORS: Record<string, string> = {
    "Layer 1": "#f97316",
    "Layer 2": "#0ea5e9",
    DeFi: "#8b5cf6",
    스테이블코인: "#22c55e",
    밈: "#f43f5e",
  };

  function cryptoPieData() {
    if (!data) return [];
    const groups = new Map<string, number>();
    for (const c of data.crypto) {
      const cat = c.category || "기타";
      groups.set(cat, (groups.get(cat) ?? 0) + c.valueKRW);
    }
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const result: { name: string; value: number; color: string }[] = [];
    let otherTotal = 0;
    sorted.forEach(([name, value]) => {
      if (value / total > 0.03) {
        result.push({ name, value, color: CRYPTO_CATEGORY_COLORS[name] ?? "#737373" });
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

  // 연금 항목별 색상 팔레트 (PensionCard와 공유)
  const PENSION_COLORS = [
    "#ec4899",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
  ];

  function pensionWithColors() {
    if (!data) return [];
    return [...data.pension]
      .sort((a, b) => b.amount - a.amount)
      .map((p, i) => ({ ...p, color: PENSION_COLORS[i % PENSION_COLORS.length] }));
  }

  function pensionPieData() {
    return pensionWithColors().map((p) => ({
      name: p.institution,
      value: p.amount,
      color: p.color,
    }));
  }

  const pensionTotal = data?.pension.reduce((s, p) => s + p.amount, 0) ?? 0;

  // 순자산 기준 배분: 부채는 부동산에서 차감하여 표시 (대부분 주택담보대출 가정)
  function netWorthAllocation() {
    if (!data) return [];
    const liabilityTotal = data.summary.totalLiabilities;
    const netWorth = data.summary.netWorth;
    if (netWorth <= 0) return [];

    const adjusted = data.allocation.map((a) => ({ ...a }));
    const realEstateIdx = adjusted.findIndex((a) => a.category === "부동산");
    let remainingLiability = liabilityTotal;
    if (realEstateIdx >= 0 && remainingLiability > 0) {
      const deduct = Math.min(adjusted[realEstateIdx].amount, remainingLiability);
      adjusted[realEstateIdx].amount -= deduct;
      remainingLiability -= deduct;
    }

    return adjusted
      .filter((a) => a.amount > 0)
      .map((a) => ({
        ...a,
        percent: Math.round((a.amount / netWorth) * 1000) / 10,
      }));
  }

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
        <div className="flex items-center gap-4">
          <MonthSelector value={month} onChange={setMonth} />
          <ThemeToggle />
          <div className="flex items-center gap-2">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
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
          {tab === "cash" && <CashTable cash={data.cash} month={month} onChange={applyChange} />}
          {tab === "stocks" && <StockTable stocks={data.stocks} month={month} onChange={applyChange} />}
          {tab === "crypto" && <CryptoTable crypto={data.crypto} month={month} onChange={applyChange} />}
          {tab === "pension" && <PensionCard pension={data.pension} month={month} onChange={applyChange} />}
          {tab === "debt" && <LiabilityCard liabilities={data.liabilities} month={month} onChange={applyChange} />}
        </div>
      )}

      {data && !loading && !isEmpty && (
        <>
          <SummaryCards
            summary={data.summary}
            pensionTotal={pensionTotal}
            prevPensionTotal={data.summary.prevPensionTotal}
          />
          <CategoryTabs active={tab} onChange={setTab} />

          {/* 전체 탭: 순자산 추이 + 파이차트 + 리밸런싱 현황 */}
          {tab === "overview" && (
            <div className="space-y-6">
              <NetWorthChart refreshKey={historyKey} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AllocationChart allocation={data.allocation} title="자산 배분 (총자산)" />
                <AllocationChart allocation={netWorthAllocation()} title="자산 배분 (순자산)" />
              </div>
              {saaTargets.length > 0 ? (
                <SAAChart
                  results={calculateSAA(
                    data.stocks,
                    data.crypto,
                    data.cash.reduce((s, c) => s + c.amount, 0),
                    saaTargets
                  )}
                />
              ) : (
                <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    아래에서 목표 비중을 설정하면 리밸런싱 현황이 표시됩니다.
                  </p>
                </div>
              )}
              <SAASettings targets={saaTargets} onSave={fetchSAA} />
            </div>
          )}

          {/* 현금 탭 */}
          {tab === "cash" && (
            <div className="space-y-6">
              <CategoryHeader
                title="현금 총액"
                current={data.cash.reduce((s, c) => s + c.amount, 0)}
                prev={data.summary.prevCashTotal}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={cashPieData()} title="현금" />
                <CategoryTrendChart dataKey="cash" title="현금" color="#22c55e" refreshKey={historyKey} />
              </div>
              <CashTable cash={data.cash} month={month} onChange={applyChange} />
            </div>
          )}

          {/* 주식 탭 */}
          {tab === "stocks" && (
            <div className="space-y-6">
              <CategoryHeader
                title="주식 총액"
                current={data.stocks.reduce((s, p) => s + p.valueKRW, 0)}
                prev={data.summary.prevStockTotal}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={stockPieData()} title="주식" />
                <CategoryTrendChart dataKey="stocks" title="주식" color="#3b82f6" refreshKey={historyKey} />
              </div>
              <StockTable stocks={data.stocks} month={month} onChange={applyChange} />
            </div>
          )}

          {/* 크립토 탭 */}
          {tab === "crypto" && (
            <div className="space-y-6">
              <CategoryHeader
                title="크립토 총액"
                current={data.crypto.reduce((s, c) => s + c.valueKRW, 0)}
                prev={data.summary.prevCryptoTotal}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={cryptoPieData()} title="크립토" />
                <CategoryTrendChart dataKey="crypto" title="크립토" color="#f59e0b" refreshKey={historyKey} />
              </div>
              <CryptoTable crypto={data.crypto} month={month} onChange={applyChange} />
            </div>
          )}

          {/* 연금 탭 */}
          {tab === "pension" && (
            <div className="space-y-6">
              <CategoryHeader
                title="연금 총액"
                current={pensionTotal}
                prev={data.summary.prevPensionTotal}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubPieChart data={pensionPieData()} title="연금" />
                <CategoryTrendChart dataKey="pension" title="연금" color="#ec4899" refreshKey={historyKey} />
              </div>
              <PensionCard
                pension={data.pension}
                month={month}
                onChange={applyChange}
                colors={PENSION_COLORS}
              />
            </div>
          )}

          {/* 부동산 탭 */}
          {tab === "property" && (
            <div className="space-y-6">
              <CategoryHeader
                title="부동산 총액"
                current={data.realEstate.reduce((s, r) => s + r.amount, 0)}
                prev={data.summary.prevRealEstateTotal}
              />
              <CategoryTrendChart dataKey="realEstate" title="부동산" color="#8b5cf6" refreshKey={historyKey} />
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
          {tab === "debt" && (
            <div className="space-y-6">
              <CategoryHeader
                title="부채 총액"
                current={data.liabilities.reduce((s, l) => s + l.amount, 0)}
                prev={data.summary.prevLiabilityTotal}
                inverseColor
              />
              <LiabilityCard liabilities={data.liabilities} month={month} onChange={applyChange} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
