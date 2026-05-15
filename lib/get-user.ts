import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { userId: null, error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  }
  return { userId: session.user.id, error: null };
}
