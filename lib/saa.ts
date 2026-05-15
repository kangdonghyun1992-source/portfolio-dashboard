export interface SAATarget {
  id?: number;
  name: string;
  targetPercent: number;
  band: number;
  tickers: string[];
  color: string;
  sortOrder?: number;
  cashFloor?: number;
}

export interface SAAResult {
  name: string;
  targetPercent: number;
  currentPercent: number;
  currentAmount: number;
  band: number;
  status: "ok" | "warning" | "danger";
  diff: number;
  rebalanceAmount: number;
  color: string;
}

export function calculateSAA(
  stocks: { ticker: string; name: string; valueKRW: number }[],
  crypto: { name: string; ticker: string; valueKRW: number }[],
  cashTotal: number,
  targets: SAATarget[]
): SAAResult[] {
  const stockTotal = stocks.reduce((s, p) => s + p.valueKRW, 0);
  const cryptoTotal = crypto.reduce((s, p) => s + p.valueKRW, 0);
  const investableTotal = cashTotal + stockTotal + cryptoTotal;

  if (investableTotal === 0 || targets.length === 0) return [];

  const results: SAAResult[] = [];

  // Find the cash target (has cashFloor > 0 or name includes "현금")
  let cashTarget: SAATarget | undefined;
  const assetTargets: SAATarget[] = [];

  for (const target of targets) {
    if (target.cashFloor && target.cashFloor > 0) {
      cashTarget = target;
    } else {
      assetTargets.push(target);
    }
  }

  function matches(tickers: string[], name: string, ticker: string): boolean {
    const nameLower = name.toLowerCase();
    const tickerLower = ticker.toLowerCase();
    // strip exchange prefix: "NYSE:KO" → "KO", "NYSEARCA:GLD" → "GLD"
    const tickerBase = (ticker.split(":").pop() ?? ticker).toLowerCase();
    return tickers.some((t) => {
      const tl = t.toLowerCase();
      // Exact matches (always safe)
      if (tickerBase === tl || tickerLower === tl || nameLower === tl) return true;
      // Only use includes for longer strings (4+ chars) to avoid "eth" matching "ethena"
      if (tl.length >= 4 && nameLower.length >= 4) {
        if (nameLower === tl || tl === nameLower) return true;
      }
      return false;
    });
  }

  for (const target of assetTargets) {
    let currentAmount = 0;

    for (const s of stocks) {
      if (matches(target.tickers, s.name, s.ticker)) {
        currentAmount += s.valueKRW;
      }
    }

    for (const c of crypto) {
      if (matches(target.tickers, c.name, c.ticker)) {
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

  // Add cash row
  if (cashTarget) {
    const cashPercent = Math.round((cashTotal / investableTotal) * 1000) / 10;
    const cashDiff = Math.round((cashPercent - cashTarget.targetPercent) * 10) / 10;
    const floor = cashTarget.cashFloor ?? 13;
    results.push({
      name: cashTarget.name,
      targetPercent: cashTarget.targetPercent,
      currentPercent: cashPercent,
      currentAmount: cashTotal,
      band: cashTarget.band,
      status:
        cashPercent < floor
          ? "danger"
          : Math.abs(cashDiff) > cashTarget.band
            ? "warning"
            : "ok",
      diff: cashDiff,
      rebalanceAmount: Math.round(
        ((cashTarget.targetPercent - cashPercent) / 100) * investableTotal
      ),
      color: cashTarget.color,
    });
  }

  return results;
}
