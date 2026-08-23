import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { kstToday } from "@/lib/daily";

// GET /api/me/today?userId=...
// 오늘(KST) 통계 — 랭킹보드 "오늘" 탭용.
// - my: 내가 오늘 획득한 점수 합 / 판수 / 코인
// - entries: 오늘 획득 점수 상위 10 (유저별 합산) + 내 순위
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

    // 오늘 전체 게임 기록 → 유저별 합산 (초기 단계 트래픽 기준 JS 집계로 충분)
    const { data: rows, error: rowsError } = await supabase
      .from("leaderboard")
      .select("user_id, nickname, score, played_at")
      .gte("played_at", startIso)
      .not("user_id", "is", null);
    if (rowsError) throw rowsError;

    const byUser = new Map<
      string,
      { nickname: string; score: number; games: number; last: string }
    >();
    for (const r of rows ?? []) {
      const cur = byUser.get(r.user_id) ?? {
        nickname: r.nickname,
        score: 0,
        games: 0,
        last: "",
      };
      cur.score += r.score ?? 0;
      cur.games += 1;
      if (r.played_at > cur.last) {
        cur.last = r.played_at;
        cur.nickname = r.nickname; // 가장 최근 닉네임
      }
      byUser.set(r.user_id, cur);
    }

    const ranked = [...byUser.entries()]
      .map(([user_id, v]) => ({
        user_id,
        nickname: v.nickname,
        score: v.score,
        games: v.games,
      }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    const mine = ranked.find((e) => e.user_id === userId) ?? null;
    const entries = ranked.slice(0, 10);

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

    return NextResponse.json({
      score: mine?.score ?? 0,
      gamesPlayed: mine?.games ?? 0,
      coins,
      myRank: mine?.rank ?? null,
      total: ranked.length,
      entries,
    });
  } catch (err) {
    console.error("GET /api/me/today error:", err);
    return NextResponse.json(
      { error: "오늘 기록을 불러오는 데 실패했습니다" },
      { status: 500 }
    );
  }
};
