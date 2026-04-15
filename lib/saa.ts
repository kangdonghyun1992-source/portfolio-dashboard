// Strategic Asset Allocation targets from portfolio.md
// Based on investable assets (excluding real estate)

export interface SAATarget {
  name: string;
  targetPercent: number;
  band: number; // ± tolerance
  tickers: string[]; // matching tickers or asset names
  color: string;
}

export const SAA_TARGETS: SAATarget[] = [
  {
    name: "ETH",
    targetPercent: 15,
    band: 5,
    tickers: ["ETH"],
    color: "#818cf8",
  },
  {
    name: "BTC",
    targetPercent: 15,
    band: 5,
    tickers: ["BTC"],
    color: "#f97316",
  },
  {
    name: "스테이블/파밍",
    targetPercent: 10,
    band: 2,
    tickers: ["USDC", "USDT", "USD.AI", "USDe", "sENA", "ENA"],
    color: "#22c55e",
  },
  {
    name: "알트 크립토",
    targetPercent: 3,
    band: 2,
    tickers: ["SOL", "ONDO", "PENDLE", "PENGU + 알파"],
    color: "#06b6d4",
  },
  {
    name: "Bucket A (배당)",
    targetPercent: 10,
    band: 3,
    tickers: ["SCHD", "KO", "JNJ", "PG"],
    color: "#3b82f6",
  },
  {
    name: "Bucket B (컴파운더)",
    targetPercent: 10,
    band: 3,
    tickers: ["BRK.B", "AAPL", "GOOGL"],
    color: "#8b5cf6",
  },
  {
    name: "GLD",
    targetPercent: 5,
    band: 2,
    tickers: ["GLD"],
    color: "#eab308",
  },
  {
    name: "위성",
    targetPercent: 5,
    band: 2,
    tickers: ["AXP", "UNH", "OXY"],
    color: "#14b8a6",
  },
  {
    name: "두나무",
    targetPercent: 1,
    band: 1,
    tickers: ["비상장"],
    color: "#ec4899",
  },
  {
    name: "Scout (구리)",
    targetPercent: 1,
    band: 1,
    tickers: ["KOSPI", "TIGER"],
    color: "#84cc16",
  },
  {
    name: "BN",
    targetPercent: 3,
    band: 2,
    tickers: ["BN"],
    color: "#6366f1",
  },
  {
    name: "SGOV",
    targetPercent: 2,
    band: 2,
    tickers: ["SGOV"],
    color: "#a3a3a3",
  },
];

// Cash target: 20% (13% hard floor)
export const CASH_TARGET = 20;
export const CASH_FLOOR = 13;

export interface SAAResult {
  name: string;
  targetPercent: number;
  currentPercent: number;
  currentAmount: number;
  band: number;
  status: "ok" | "warning" | "danger";
  diff: number; // currentPercent - targetPercent
  rebalanceAmount: number; // amount to buy(+) or sell(-)
  color: string;
}

export function calculateSAA(
  stocks: { ticker: string; name: string; valueKRW: number }[],
  crypto: { name: string; ticker: string; valueKRW: number }[],
  cashTotal: number
): SAAResult[] {
  // Investable total = cash + stocks + crypto
  const stockTotal = stocks.reduce((s, p) => s + p.valueKRW, 0);
  const cryptoTotal = crypto.reduce((s, p) => s + p.valueKRW, 0);
  const investableTotal = cashTotal + stockTotal + cryptoTotal;

  if (investableTotal === 0) return [];

  const results: SAAResult[] = [];

  for (const target of SAA_TARGETS) {
    // Find matching positions
    let currentAmount = 0;

    for (const s of stocks) {
      // Match by ticker suffix or name
      const tickerBase = s.ticker.split(":").pop() ?? s.ticker;
      if (
        target.tickers.some(
          (t) => tickerBase === t || s.ticker === t || s.name.includes(t)
        )
      ) {
        currentAmount += s.valueKRW;
      }
    }

    for (const c of crypto) {
      if (
        target.tickers.some(
          (t) => c.name === t || c.ticker === t || c.name.includes(t)
        )
      ) {
        currentAmount += c.valueKRW;
      }
    }

    const currentPercent =
      Math.round((currentAmount / investableTotal) * 1000) / 10;
    const diff = Math.round((currentPercent - target.targetPercent) * 10) / 10;
    const absDiff = Math.abs(diff);

    let status: "ok" | "warning" | "danger" = "ok";
    if (absDiff > target.band) {
      status = "danger";
    } else if (absDiff > target.band * 0.6) {
      status = "warning";
    }

    const rebalanceAmount = Math.round(
      ((target.targetPercent - currentPercent) / 100) * investableTotal
    );

    results.push({
      name: target.name,
      targetPercent: target.targetPercent,
      currentPercent,
      currentAmount,
      band: target.band,
      status,
      diff,
      rebalanceAmount,
      color: target.color,
    });
  }

  // Add cash
  const cashPercent =
    Math.round((cashTotal / investableTotal) * 1000) / 10;
  const cashDiff = Math.round((cashPercent - CASH_TARGET) * 10) / 10;
  results.push({
    name: "현금",
    targetPercent: CASH_TARGET,
    currentPercent: cashPercent,
    currentAmount: cashTotal,
    band: 7,
    status:
      cashPercent < CASH_FLOOR
        ? "danger"
        : Math.abs(cashDiff) > 7
          ? "warning"
          : "ok",
    diff: cashDiff,
    rebalanceAmount: Math.round(
      ((CASH_TARGET - cashPercent) / 100) * investableTotal
    ),
    color: "#22c55e",
  });

  return results;
}
