// Price refresh logic - shared between portfolio route and cron
// Fetches live prices and updates DB for current-month (or specified) records

type DbLike = {
  prepare: (sql: string) => {
    all: (...args: unknown[]) => Promise<unknown[]>;
    get: (...args: unknown[]) => Promise<unknown>;
    run: (...args: unknown[]) => Promise<void>;
  };
};

async function getStockPrice(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const symbol = ticker.split(":").pop() ?? ticker;
    if (!symbol || symbol === "KOSPI" || symbol === "비상장") return null;
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

async function getCryptoPrice(coinId: string): Promise<number | null> {
  try {
    if (!coinId) return null;
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

const STALE_MS = 60 * 60 * 1000; // 1 hour

function isStale(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return true;
  const t = Date.parse(updatedAt);
  if (isNaN(t)) return true;
  return Date.now() - t > STALE_MS;
}

export async function refreshPricesForMonth(
  db: DbLike,
  userId: string,
  monthKey: string,
  options: { force?: boolean } = {}
): Promise<void> {
  const { force = false } = options;

  // Skip locked records (finalized/past months)
  const stocks = await db.prepare(
    "SELECT id, ticker, quantity, domestic, price_updated_at, locked FROM stocks WHERE user_id = ? AND month = ?"
  ).all(userId, monthKey) as {
    id: number; ticker: string; quantity: number; domestic: number;
    price_updated_at: string | null; locked: number;
  }[];

  const cryptos = await db.prepare(
    "SELECT id, ticker, quantity, price_updated_at, locked FROM crypto WHERE user_id = ? AND month = ?"
  ).all(userId, monthKey) as {
    id: number; ticker: string; quantity: number;
    price_updated_at: string | null; locked: number;
  }[];

  const stocksToRefresh = stocks.filter((s) => !s.locked && s.ticker && s.quantity > 0 && (force || isStale(s.price_updated_at)));
  const cryptoToRefresh = cryptos.filter((c) => !c.locked && c.ticker && c.quantity > 0 && (force || isStale(c.price_updated_at)));

  if (stocksToRefresh.length === 0 && cryptoToRefresh.length === 0) return;

  const now = new Date().toISOString();
  const fxRate = stocksToRefresh.some((s) => !s.domestic) ? await getFxRate() : 1400;

  await Promise.allSettled([
    ...stocksToRefresh.map(async (s) => {
      const result = await getStockPrice(s.ticker);
      if (!result) return;
      const valueUSD = result.currency === "USD" ? s.quantity * result.price : null;
      const valueKRW = Math.round(s.quantity * result.price * (result.currency === "USD" ? fxRate : 1));
      await db.prepare(
        "UPDATE stocks SET current_price = ?, value_usd = ?, value_krw = ?, price_updated_at = ? WHERE id = ? AND user_id = ?"
      ).run(result.price, valueUSD, valueKRW, now, s.id, userId);
    }),
    ...cryptoToRefresh.map(async (c) => {
      const price = await getCryptoPrice(c.ticker);
      if (!price) return;
      const valueKRW = Math.round(c.quantity * price);
      await db.prepare(
        "UPDATE crypto SET current_price = ?, value_krw = ?, price_updated_at = ? WHERE id = ? AND user_id = ?"
      ).run(price, valueKRW, now, c.id, userId);
    }),
  ]);
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
