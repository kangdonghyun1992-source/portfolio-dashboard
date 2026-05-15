import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

// Returns a sorted list of month keys (e.g., "2026-03") that have any data for this user
export async function GET() {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const db = getDb();
    const rows = await db.prepare(`
      SELECT DISTINCT month FROM (
        SELECT month FROM cash WHERE user_id = ?
        UNION SELECT month FROM stocks WHERE user_id = ?
        UNION SELECT month FROM crypto WHERE user_id = ?
        UNION SELECT month FROM liabilities WHERE user_id = ?
        UNION SELECT month FROM pension WHERE user_id = ?
        UNION SELECT month FROM real_estate WHERE user_id = ?
        UNION SELECT month FROM summary WHERE user_id = ? AND (total_assets > 0 OR net_worth > 0 OR total_liabilities > 0)
      ) WHERE month IS NOT NULL AND month <> ''
      ORDER BY month ASC
    `).all(userId, userId, userId, userId, userId, userId, userId) as { month: string }[];

    return NextResponse.json(rows.map((r) => r.month));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
