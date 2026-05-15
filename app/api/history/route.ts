import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const db = getDb();
    // totalAssets/netWorth는 summary 캐시 대신 현재 행 합으로 재계산 — 연금 항상 제외
    const rows = await db.prepare(`
      SELECT s.month,
        COALESCE((SELECT SUM(amount) FROM cash WHERE user_id = ? AND month = s.month), 0) as cash,
        COALESCE((SELECT SUM(value_krw) FROM stocks WHERE user_id = ? AND month = s.month), 0) as stocks,
        COALESCE((SELECT SUM(value_krw) FROM crypto WHERE user_id = ? AND month = s.month), 0) as crypto,
        COALESCE((SELECT SUM(amount) FROM real_estate WHERE user_id = ? AND month = s.month), 0) as realEstate,
        COALESCE((SELECT SUM(amount) FROM pension WHERE user_id = ? AND month = s.month), 0) as pension,
        COALESCE((SELECT SUM(amount) FROM liabilities WHERE user_id = ? AND month = s.month), 0) as totalLiabilities
      FROM summary s WHERE s.user_id = ? ORDER BY s.month ASC
    `).all(userId, userId, userId, userId, userId, userId, userId) as { month: string; cash: number; stocks: number; crypto: number; realEstate: number; pension: number; totalLiabilities: number }[];

    const data = rows
      .map((r) => {
        const totalAssets = r.cash + r.stocks + r.crypto + r.realEstate;
        const netWorth = totalAssets - r.totalLiabilities;
        return { ...r, totalAssets, netWorth, label: `${parseInt(r.month.split("-")[1])}월` };
      })
      .filter((r) => r.totalAssets > 0 || r.netWorth !== 0);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
