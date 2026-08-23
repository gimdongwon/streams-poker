import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { kstToday } from "@/lib/daily";

// GET /api/me/today?userId=...
// 오늘(KST) 획득한 점수 합 / 판수 / 코인. 랭킹보드 "오늘" 탭용.
// - 점수·판수: leaderboard 기록 (모든 모드)
// - 코인: coin_log 양수 합 (마이그레이션 0016 이전엔 테이블이 없어 null 반환)
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
    }

    // KST 자정 이후 구간
    const startIso = new Date(`${kstToday()}T00:00:00+09:00`).toISOString();

    const { data: games, error: gamesError } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("user_id", userId)
      .gte("played_at", startIso);
    if (gamesError) throw gamesError;

    const score = (games ?? []).reduce((sum, g) => sum + (g.score ?? 0), 0);
    const gamesPlayed = games?.length ?? 0;

    // 코인: coin_log가 아직 없으면(마이그레이션 전) null — UI에서 "-" 표시
    let coins: number | null = null;
    const { data: coinRows, error: coinError } = await supabase
      .from("coin_log")
      .select("amount")
      .eq("user_id", userId)
      .gt("amount", 0)
      .gte("created_at", startIso);
    if (!coinError) {
      coins = (coinRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);
    }

    return NextResponse.json({ score, gamesPlayed, coins });
  } catch (err) {
    console.error("GET /api/me/today error:", err);
    return NextResponse.json(
      { error: "오늘 기록을 불러오는 데 실패했습니다" },
      { status: 500 }
    );
  }
};
