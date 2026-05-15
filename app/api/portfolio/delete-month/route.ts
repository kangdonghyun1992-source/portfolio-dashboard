import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function POST(request: Request) {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const { month } = await request.json();
    const monthKey = `2026-${month}`;
    const db = getDb();

    const tables = ["cash", "stocks", "crypto", "liabilities", "pension", "real_estate", "summary"];
    for (const table of tables) {
      await db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND month = ?`).run(userId, monthKey);
    }

    return NextResponse.json({ success: true, deleted: monthKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
