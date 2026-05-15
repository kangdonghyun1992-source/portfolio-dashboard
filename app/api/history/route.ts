import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const db = getDb();
    const rows = await db.prepare(`
      SELECT s.month, s.total_assets as totalAssets, s.total_liabilities as totalLiabilities, s.net_worth as netWorth,
        COALESCE((SELECT SUM(amount) FROM cash WHERE user_id = ? AND month = s.month), 0) as cash,
        COALESCE((SELECT SUM(value_krw) FROM stocks WHERE user_id = ? AND month = s.month), 0) as stocks,
        COALESCE((SELECT SUM(value_krw) FROM crypto WHERE user_id = ? AND month = s.month), 0) as crypto,
        COALESCE((SELECT SUM(amount) FROM real_estate WHERE user_id = ? AND month = s.month), 0) as realEstate,
        COALESCE((SELECT SUM(amount) FROM pension WHERE user_id = ? AND month = s.month), 0) as pension
      FROM summary s WHERE s.user_id = ? AND (s.total_assets > 0 OR s.net_worth > 0) ORDER BY s.month ASC
    `).all(userId, userId, userId, userId, userId, userId) as { month: string; totalAssets: number; totalLiabilities: number; netWorth: number; cash: number; stocks: number; crypto: number; realEstate: number; pension: number }[];

    const data = rows.map((r) => ({ ...r, label: `${parseInt(r.month.split("-")[1])}월` }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
