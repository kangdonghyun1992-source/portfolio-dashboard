import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const db = getDb();
    const rows = await db.prepare(
      "SELECT id, name, target_percent, band, tickers, color, sort_order, cash_floor FROM saa_targets WHERE user_id = ? ORDER BY sort_order ASC, id ASC"
    ).all(userId) as {
      id: number; name: string; target_percent: number; band: number;
      tickers: string; color: string; sort_order: number; cash_floor: number;
    }[];

    const targets = rows.map((r) => ({
      id: r.id,
      name: r.name,
      targetPercent: r.target_percent,
      band: r.band,
      tickers: r.tickers ? r.tickers.split(",").map((t: string) => t.trim()) : [],
      color: r.color,
      sortOrder: r.sort_order,
      cashFloor: r.cash_floor,
    }));

    return NextResponse.json(targets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const body = await request.json();
    const { action, id, name, targetPercent, band, tickers, color, sortOrder, cashFloor } = body;
    const db = getDb();

    if (action === "add") {
      const tickerStr = Array.isArray(tickers) ? tickers.join(",") : (tickers ?? "");
      await db.prepare(
        "INSERT INTO saa_targets (user_id, name, target_percent, band, tickers, color, sort_order, cash_floor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(userId, name, targetPercent ?? 0, band ?? 3, tickerStr, color ?? "#737373", sortOrder ?? 0, cashFloor ?? 0);
      return NextResponse.json({ success: true });
    }

    if (action === "update" && id) {
      const tickerStr = Array.isArray(tickers) ? tickers.join(",") : (tickers ?? "");
      await db.prepare(
        "UPDATE saa_targets SET name = ?, target_percent = ?, band = ?, tickers = ?, color = ?, sort_order = ?, cash_floor = ? WHERE user_id = ? AND id = ?"
      ).run(name, targetPercent, band, tickerStr, color, sortOrder ?? 0, cashFloor ?? 0, userId, id);
      return NextResponse.json({ success: true });
    }

    if (action === "delete" && id) {
      await db.prepare("DELETE FROM saa_targets WHERE user_id = ? AND id = ?").run(userId, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
