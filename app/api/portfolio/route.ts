import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type {
  PortfolioData, CashAsset, StockPosition, CryptoPosition,
  Liability, PensionAccount, RealEstate, Summary, AssetAllocation,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") ?? "04";
    const monthKey = `2026-${month}`;
    const db = getDb();

    let summaryRow = await db.prepare("SELECT * FROM summary WHERE month = ?").get(monthKey) as
      | { total_assets: number; total_liabilities: number; net_worth: number; fx_rate: number } | undefined;

    // Auto-create summary row for new months
    if (!summaryRow) {
      await db.prepare(
        "INSERT OR IGNORE INTO summary (month, total_assets, total_liabilities, net_worth, fx_rate) VALUES (?, 0, 0, 0, 1350)"
      ).run(monthKey);
      summaryRow = await db.prepare("SELECT * FROM summary WHERE month = ?").get(monthKey) as
        | { total_assets: number; total_liabilities: number; net_worth: number; fx_rate: number } | undefined;
    }

    const prevMonth = `2026-${String(Math.max(1, parseInt(month) - 1)).padStart(2, "0")}`;
    const prevRow = await db.prepare("SELECT * FROM summary WHERE month = ?").get(prevMonth) as
      | { total_assets: number; net_worth: number } | undefined;

    const cash = await db.prepare("SELECT id, account, amount, note FROM cash WHERE month = ?").all(monthKey) as CashAsset[];
    const cashTotal = cash.reduce((s, c) => s + c.amount, 0);

    const stockRows = await db.prepare("SELECT * FROM stocks WHERE month = ?").all(monthKey) as {
      id: number; platform: string; name: string; ticker: string; quantity: number;
      current_price: number; currency: string; value_usd: number | null;
      value_krw: number; category: string; domestic: number;
    }[];
    const stocks: StockPosition[] = stockRows.map((r) => ({
      id: r.id, platform: r.platform, name: r.name, ticker: r.ticker,
      quantity: r.quantity, currentPrice: r.current_price,
      currency: r.domestic ? "KRW" as const : "USD" as const,
      valueUSD: r.value_usd, valueKRW: r.value_krw, category: r.category,
    }));
    const stockTotal = stocks.reduce((s, p) => s + p.valueKRW, 0);

    const cryptoRows = await db.prepare("SELECT * FROM crypto WHERE month = ?").all(monthKey) as {
      id: number; name: string; ticker: string; exchange: string; quantity: number;
      current_price: number; value_krw: number;
    }[];
    const crypto: CryptoPosition[] = cryptoRows.map((r) => ({
      id: r.id, name: r.name, ticker: r.ticker, exchange: r.exchange,
      quantity: r.quantity, avgPrice: 0, currentPrice: r.current_price,
      valueKRW: r.value_krw, pnlPercent: 0,
    }));
    const cryptoTotal = crypto.reduce((s, c) => s + c.valueKRW, 0);

    const liabilities = await db.prepare("SELECT id, name, amount, rate, note FROM liabilities WHERE month = ?").all(monthKey) as Liability[];
    const liabilityTotal = liabilities.reduce((s, l) => s + l.amount, 0);

    const pension = await db.prepare("SELECT id, institution, type, amount FROM pension WHERE month = ?").all(monthKey) as PensionAccount[];

    const realEstate = await db.prepare("SELECT id, name, amount, note FROM real_estate WHERE month = ?").all(monthKey) as RealEstate[];
    const realEstateTotal = realEstate.reduce((s, r) => s + r.amount, 0);

    const totalAssets = summaryRow?.total_assets || cashTotal + stockTotal + cryptoTotal + realEstateTotal;
    const summary: Summary = {
      totalAssets, totalLiabilities: liabilityTotal,
      netWorth: summaryRow?.net_worth || totalAssets - liabilityTotal,
      snapshotDate: `2026-${month}-01`, fxRate: summaryRow?.fx_rate ?? 1471.02,
      prevTotalAssets: prevRow?.total_assets, prevNetWorth: prevRow?.net_worth,
    };

    const allocation: AssetAllocation[] = [
      { category: "현금", amount: cashTotal, percent: Math.round((cashTotal / totalAssets) * 1000) / 10, color: "#22c55e" },
      { category: "주식", amount: stockTotal, percent: Math.round((stockTotal / totalAssets) * 1000) / 10, color: "#3b82f6" },
      { category: "암호화폐", amount: cryptoTotal, percent: Math.round((cryptoTotal / totalAssets) * 1000) / 10, color: "#f59e0b" },
      { category: "부동산", amount: realEstateTotal, percent: Math.round((realEstateTotal / totalAssets) * 1000) / 10, color: "#8b5cf6" },
    ];
    const pensionTotal = pension.reduce((s, p) => s + p.amount, 0);
    if (pensionTotal > 0) {
      allocation.push({ category: "연금", amount: pensionTotal, percent: Math.round((pensionTotal / totalAssets) * 1000) / 10, color: "#ec4899" });
    }

    const data: PortfolioData = { summary, cash, stocks, crypto, liabilities, pension, realEstate, allocation };
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Portfolio API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
