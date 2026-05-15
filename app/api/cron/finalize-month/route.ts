import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { refreshPricesForMonth } from "@/lib/refresh-prices";

// Vercel Cron: runs on the 1st of each month at 00:05 UTC
// Finalizes the previous month by refreshing prices one last time, then locking them.
// Authenticated via CRON_SECRET env var.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();

    // Compute previous month (Asia/Seoul timezone)
    const now = new Date();
    // Use UTC-based arithmetic to avoid DST issues; add 9h for KST then go back 1 month
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const prevYear = kst.getUTCMonth() === 0 ? kst.getUTCFullYear() - 1 : kst.getUTCFullYear();
    const prevMonth = kst.getUTCMonth() === 0 ? 12 : kst.getUTCMonth(); // getUTCMonth is 0-indexed for current
    const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

    // Find all users with data in prev month
    const stockUsers = await db.prepare(
      "SELECT DISTINCT user_id FROM stocks WHERE month = ? AND user_id <> ''"
    ).all(prevMonthKey) as { user_id: string }[];
    const cryptoUsers = await db.prepare(
      "SELECT DISTINCT user_id FROM crypto WHERE month = ? AND user_id <> ''"
    ).all(prevMonthKey) as { user_id: string }[];

    const userIds = Array.from(new Set([
      ...stockUsers.map((r) => r.user_id),
      ...cryptoUsers.map((r) => r.user_id),
    ]));

    let refreshed = 0;
    for (const userId of userIds) {
      try {
        // Force refresh to get the latest prices, then lock
        await refreshPricesForMonth(db, userId, prevMonthKey, { force: true });
        await db.prepare(
          "UPDATE stocks SET locked = 1 WHERE user_id = ? AND month = ?"
        ).run(userId, prevMonthKey);
        await db.prepare(
          "UPDATE crypto SET locked = 1 WHERE user_id = ? AND month = ?"
        ).run(userId, prevMonthKey);
        refreshed += 1;
      } catch (e) {
        console.error(`finalize-month failed for user ${userId}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      prevMonthKey,
      usersProcessed: refreshed,
      totalUsers: userIds.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
