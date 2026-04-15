export interface CashAsset {
  id?: number;
  account: string;
  amount: number;
  note: string;
}

export interface StockPosition {
  id?: number;
  platform: string;
  name: string;
  ticker: string;
  quantity: number;
  currentPrice: number;
  currency: "USD" | "KRW";
  valueUSD: number | null;
  valueKRW: number;
  category: string;
}

export interface CryptoPosition {
  id?: number;
  name: string;
  ticker: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  valueKRW: number;
  pnlPercent: number;
}

export interface Liability {
  id?: number;
  name: string;
  amount: number;
  rate: number;
  note: string;
}

export interface PensionAccount {
  id?: number;
  institution: string;
  type: string;
  amount: number;
}

export interface RealEstate {
  id?: number;
  name: string;
  amount: number;
  note: string;
}

export interface Summary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  snapshotDate: string;
  fxRate: number;
  prevTotalAssets?: number;
  prevNetWorth?: number;
}

export interface AssetAllocation {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

export interface PortfolioData {
  summary: Summary;
  cash: CashAsset[];
  stocks: StockPosition[];
  crypto: CryptoPosition[];
  liabilities: Liability[];
  pension: PensionAccount[];
  realEstate: RealEstate[];
  allocation: AssetAllocation[];
}
