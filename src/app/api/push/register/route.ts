import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/push/register { userId, token, platform } → 푸시 토큰 저장(upsert)
export const POST = async (request: NextRequest) => {
  try {
    const { userId, token, platform } = await request.json();
    if (!userId || !token) {
      return NextResponse.json({ error: "필수 정보 누락" }, { status: 400 });
    }
    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        { token, user_id: userId, platform: platform ?? null, updated_at: new Date().toISOString() },
        { onConflict: "token" }
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/push/register error:", err);
    return NextResponse.json({ error: "토큰 저장 실패" }, { status: 500 });
  }
};
