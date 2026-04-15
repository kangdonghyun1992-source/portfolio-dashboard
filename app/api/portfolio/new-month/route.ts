import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { month } = await request.json();
    const monthKey = `2026-${month}`;
    const prevMonth = `2026-${String(Math.max(1, parseInt(month) - 1)).padStart(2, "0")}`;
    const db = getDb();

    const existing = await db.prepare("SELECT month FROM summary WHERE month = ?").get(monthKey);
    if (existing) {
      return NextResponse.json({ success: true, message: "이미 존재합니다" });
    }

    await db.prepare(`INSERT INTO summary (month, total_assets, total_liabilities, net_worth, fx_rate)
      SELECT ?, total_assets, total_liabilities, net_worth, fx_rate FROM summary WHERE month = ?`).run(monthKey, prevMonth);

    const tables = ["cash", "stocks", "crypto", "liabilities", "pension", "real_estate"];
    // For each table, copy rows from prev month. We need to know the columns.
    const colMap: Record<string, string> = {
      cash: "account, amount, note",
      stocks: "platform, name, ticker, quantity, current_price, currency, value_usd, value_krw, category, domestic",
      crypto: "name, ticker, exchange, quantity, current_price, value_krw",
      liabilities: "name, amount, rate, note",
      pension: "institution, type, amount",
      real_estate: "name, amount, note",
    };

    for (const table of tables) {
      const cols = colMap[table];
      await db.prepare(`INSERT INTO ${table} (month, ${cols}) SELECT ?, ${cols} FROM ${table} WHERE month = ?`).run(monthKey, prevMonth);
    }

    return NextResponse.json({ success: true, created: monthKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
