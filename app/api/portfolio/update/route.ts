import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

interface UpdateRequest {
  action: "update" | "add" | "delete";
  table: "cash" | "stocks" | "crypto" | "liabilities" | "pension" | "real_estate";
  month: string;
  id?: number;
  values: Record<string, string | number>;
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await getAuthUser();
    if (!userId) return error!;

    const body: UpdateRequest = await request.json();
    const { action, table, month, id, values } = body;
    const monthKey = `2026-${month}`;
    const db = getDb();

    if (action === "add") {
      const cols = ["user_id", "month", ...Object.keys(values)];
      const placeholders = cols.map(() => "?").join(",");
      const vals = [userId, monthKey, ...Object.values(values)];
      await db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`).run(...vals);
      return NextResponse.json({ success: true, action: "added" });
    }

    if (action === "update" && id) {
      const sets = Object.keys(values).map((k) => `${k} = ?`).join(", ");
      const vals = [...Object.values(values), userId, id];
      await db.prepare(`UPDATE ${table} SET ${sets} WHERE user_id = ? AND id = ?`).run(...vals);
      return NextResponse.json({ success: true, action: "updated" });
    }

    if (action === "delete" && id) {
      await db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND id = ?`).run(userId, id);
      return NextResponse.json({ success: true, action: "deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
