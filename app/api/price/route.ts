import { NextResponse } from "next/server";

// Fetch stock price from Yahoo Finance
async function getStockPrice(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    // Clean ticker: "NYSE:KO" → "KO", "NASDAQ:AAPL" → "AAPL", "KOSPI" → skip
    let symbol = ticker.split(":").pop() ?? ticker;
    if (symbol === "KOSPI" || symbol === "비상장") return null;

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    const currency = data.chart?.result?.[0]?.meta?.currency ?? "USD";
    if (!price) return null;
    return { price, currency };
  } catch {
    return null;
  }
}

// Fetch crypto price from CoinGecko (in KRW)
async function getCryptoPrice(coinId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=krw`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[coinId]?.krw ?? null;
  } catch {
    return null;
  }
}

// Fetch USD/KRW exchange rate
async function getFxRate(): Promise<number> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return 1400;
    const data = await res.json();
    return data.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1400;
  } catch {
    return 1400;
  }
}

import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type"); // "stock" or "crypto"
  const ticker = searchParams.get("ticker") ?? "";
  const quantity = Number(searchParams.get("quantity") ?? "0");

  if (type === "stock") {
    const result = await getStockPrice(ticker);
    if (!result) return NextResponse.json({ error: "가격 조회 실패" }, { status: 404 });

    const fxRate = result.currency === "USD" ? await getFxRate() : 1;
    const valueUSD = result.currency === "USD" ? quantity * result.price : null;
    const valueKRW = Math.round(quantity * result.price * fxRate);

    return NextResponse.json({
      price: result.price,
      currency: result.currency,
      fxRate: result.currency === "USD" ? fxRate : undefined,
      valueUSD,
      valueKRW,
    });
  }

  if (type === "crypto") {
    const price = await getCryptoPrice(ticker);
    if (!price) return NextResponse.json({ error: "가격 조회 실패" }, { status: 404 });

    return NextResponse.json({
      price,
      currency: "KRW",
      valueKRW: Math.round(quantity * price),
    });
  }

  return NextResponse.json({ error: "type must be stock or crypto" }, { status: 400 });
}
