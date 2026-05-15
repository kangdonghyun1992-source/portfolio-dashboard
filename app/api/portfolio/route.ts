import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { refreshPricesForMonth, getCurrentMonthKey } from "@/lib/refresh-prices";
import type {
  PortfolioData, CashAsset, StockPosition, CryptoPosition,
  Liability, PensionAccount, RealEstate, Summary, AssetAllocation,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") ?? "04";
    const monthKey = `2026-${month}`;
    const db = getDb();

    // Auto-refresh current-month prices (if stale); past months are frozen via locked flag
    if (monthKey === getCurrentMonthKey()) {
      await refreshPricesForMonth(db, userId, monthKey);
    }

    let summaryRow = await db.prepare("SELECT * FROM summary WHERE user_id = ? AND month = ?").get(userId, monthKey) as
      | { total_assets: number; total_liabilities: number; net_worth: number; fx_rate: number } | undefined;

    if (!summaryRow) {
      await db.prepare(
        "INSERT OR IGNORE INTO summary (user_id, month, total_assets, total_liabilities, net_worth, fx_rate) VALUES (?, ?, 0, 0, 0, 1350)"
      ).run(userId, monthKey);
      summaryRow = await db.prepare("SELECT * FROM summary WHERE user_id = ? AND month = ?").get(userId, monthKey) as
        | { total_assets: number; total_liabilities: number; net_worth: number; fx_rate: number } | undefined;
    }

    const prevMonth = `2026-${String(Math.max(1, parseInt(month) - 1)).padStart(2, "0")}`;
    const prevRow = await db.prepare("SELECT * FROM summary WHERE user_id = ? AND month = ?").get(userId, prevMonth) as
      | { total_assets: number; net_worth: number } | undefined;

    const cash = await db.prepare("SELECT id, account, amount, note FROM cash WHERE user_id = ? AND month = ?").all(userId, monthKey) as CashAsset[];
    const cashTotal = cash.reduce((s, c) => s + c.amount, 0);

    // 전월 주식/크립토 평가금 매칭 (ticker 기준)
    const prevStockRows = await db.prepare("SELECT ticker, value_krw FROM stocks WHERE user_id = ? AND month = ?").all(userId, prevMonth) as { ticker: string; value_krw: number }[];
    const prevStockMap = new Map(prevStockRows.map((r) => [r.ticker, r.value_krw]));

    const prevCryptoRows = await db.prepare("SELECT ticker, value_krw FROM crypto WHERE user_id = ? AND month = ?").all(userId, prevMonth) as { ticker: string; value_krw: number }[];
    const prevCryptoMap = new Map(prevCryptoRows.map((r) => [r.ticker, r.value_krw]));

    const stockRows = await db.prepare("SELECT * FROM stocks WHERE user_id = ? AND month = ?").all(userId, monthKey) as {
      id: number; platform: string; name: string; ticker: string; quantity: number;
      avg_price: number; current_price: number; currency: string; value_usd: number | null;
      value_krw: number; category: string; domestic: number;
    }[];
    const stocks: StockPosition[] = stockRows.map((r) => ({
      id: r.id, platform: r.platform, name: r.name, ticker: r.ticker,
      quantity: r.quantity, avgPrice: r.avg_price ?? 0, currentPrice: r.current_price,
      currency: r.domestic ? "KRW" as const : "USD" as const,
      valueUSD: r.value_usd, valueKRW: r.value_krw, category: r.category,
      prevValueKRW: prevStockMap.get(r.ticker),
    }));
    const stockTotal = stocks.reduce((s, p) => s + p.valueKRW, 0);

    const cryptoRows = await db.prepare("SELECT * FROM crypto WHERE user_id = ? AND month = ?").all(userId, monthKey) as {
      id: number; name: string; ticker: string; exchange: string; quantity: number;
      avg_price: number; current_price: number; value_krw: number; category: string;
    }[];
    const crypto: CryptoPosition[] = cryptoRows.map((r) => ({
      id: r.id, name: r.name, ticker: r.ticker, exchange: r.exchange,
      quantity: r.quantity, avgPrice: r.avg_price ?? 0, currentPrice: r.current_price,
      valueKRW: r.value_krw, pnlPercent: 0, category: r.category ?? "기타",
      prevValueKRW: prevCryptoMap.get(r.ticker),
    }));
    const cryptoTotal = crypto.reduce((s, c) => s + c.valueKRW, 0);

    const liabilities = await db.prepare("SELECT id, name, amount, rate, note FROM liabilities WHERE user_id = ? AND month = ?").all(userId, monthKey) as Liability[];
    const liabilityTotal = liabilities.reduce((s, l) => s + l.amount, 0);

    const pension = await db.prepare("SELECT id, institution, type, amount FROM pension WHERE user_id = ? AND month = ?").all(userId, monthKey) as PensionAccount[];

    const realEstate = await db.prepare("SELECT id, name, amount, note FROM real_estate WHERE user_id = ? AND month = ?").all(userId, monthKey) as RealEstate[];
    const realEstateTotal = realEstate.reduce((s, r) => s + r.amount, 0);

    // Prev-month totals per category (for 전월 대비 변동률)
    const prevCashRow = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;
    const prevStockSumRow = await db.prepare("SELECT COALESCE(SUM(value_krw), 0) as total FROM stocks WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;
    const prevCryptoSumRow = await db.prepare("SELECT COALESCE(SUM(value_krw), 0) as total FROM crypto WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;
    const prevPensionRow = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM pension WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;
    const prevRealEstateRow = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM real_estate WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;
    const prevLiabilityRow = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM liabilities WHERE user_id = ? AND month = ?").get(userId, prevMonth) as { total: number } | undefined;

    // 항상 현재 보유 자산/부채에서 재계산 (요약 행은 캐시에 불과)
    const totalAssets = cashTotal + stockTotal + cryptoTotal + realEstateTotal;
    const netWorth = totalAssets - liabilityTotal;

    // 요약 행을 최신 합계로 동기화 (history 차트가 이 값을 읽음)
    if (
      summaryRow?.total_assets !== totalAssets ||
      summaryRow?.total_liabilities !== liabilityTotal ||
      summaryRow?.net_worth !== netWorth
    ) {
      await db.prepare(
        "UPDATE summary SET total_assets = ?, total_liabilities = ?, net_worth = ? WHERE user_id = ? AND month = ?"
      ).run(totalAssets, liabilityTotal, netWorth, userId, monthKey);
    }

    const summary: Summary = {
      totalAssets, totalLiabilities: liabilityTotal,
      netWorth,
      snapshotDate: `2026-${month}-01`, fxRate: summaryRow?.fx_rate ?? 1471.02,
      prevTotalAssets: prevRow?.total_assets, prevNetWorth: prevRow?.net_worth,
      prevCashTotal: prevCashRow?.total,
      prevStockTotal: prevStockSumRow?.total,
      prevCryptoTotal: prevCryptoSumRow?.total,
      prevPensionTotal: prevPensionRow?.total,
      prevRealEstateTotal: prevRealEstateRow?.total,
      prevLiabilityTotal: prevLiabilityRow?.total,
    };

    // 자산 배분은 연금 제외 — 총자산(현금/주식/암호화폐/부동산) 기준 100%
    const allocation: AssetAllocation[] = [
      { category: "현금", amount: cashTotal, percent: totalAssets > 0 ? Math.round((cashTotal / totalAssets) * 1000) / 10 : 0, color: "#22c55e" },
      { category: "주식", amount: stockTotal, percent: totalAssets > 0 ? Math.round((stockTotal / totalAssets) * 1000) / 10 : 0, color: "#3b82f6" },
      { category: "암호화폐", amount: cryptoTotal, percent: totalAssets > 0 ? Math.round((cryptoTotal / totalAssets) * 1000) / 10 : 0, color: "#f59e0b" },
      { category: "부동산", amount: realEstateTotal, percent: totalAssets > 0 ? Math.round((realEstateTotal / totalAssets) * 1000) / 10 : 0, color: "#8b5cf6" },
    ];

    const data: PortfolioData = { summary, cash, stocks, crypto, liabilities, pension, realEstate, allocation };
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Portfolio API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
