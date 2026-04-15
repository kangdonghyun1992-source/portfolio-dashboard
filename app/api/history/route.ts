import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.prepare(`
      SELECT s.month, s.total_assets as totalAssets, s.total_liabilities as totalLiabilities, s.net_worth as netWorth,
        COALESCE((SELECT SUM(amount) FROM cash WHERE month = s.month), 0) as cash,
        COALESCE((SELECT SUM(value_krw) FROM stocks WHERE month = s.month), 0) as stocks,
        COALESCE((SELECT SUM(value_krw) FROM crypto WHERE month = s.month), 0) as crypto,
        COALESCE((SELECT SUM(amount) FROM real_estate WHERE month = s.month), 0) as realEstate,
        COALESCE((SELECT SUM(amount) FROM pension WHERE month = s.month), 0) as pension
      FROM summary s WHERE s.total_assets > 0 OR s.net_worth > 0 ORDER BY s.month ASC
    `).all() as { month: string; totalAssets: number; totalLiabilities: number; netWorth: number; cash: number; stocks: number; crypto: number; realEstate: number; pension: number }[];

    const data = rows.map((r) => ({ ...r, label: `${parseInt(r.month.split("-")[1])}월` }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
