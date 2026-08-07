import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { kstToday, msUntilKstMidnight } from "@/lib/daily";

// GET /api/daily/leaderboard?userId=...
// 오늘의 덱 상위 10 (게스트 제외) + 내 도전 상태/순위 + 자정까지 남은 시간.
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = kstToday();

    const { data: rows, error } = await supabase
      .from("daily_scores")
      .select("user_id, score, users!inner(nickname, is_guest)")
      .eq("date", date)
      .eq("users.is_guest", false)
      .not("submitted_at", "is", null)
      .order("score", { ascending: false })
      .limit(10);
    if (error) throw error;

    const entries = (rows ?? []).map((r, i) => {
      const u = r.users as unknown as { nickname: string };
      return {
        rank: i + 1,
        user_id: r.user_id as string,
        nickname: u?.nickname ?? "?",
        score: r.score as number,
      };
    });

    // 내 상태
    let my: {
      played: boolean;
      submitted: boolean;
      score: number | null;
      rank: number | null;
      total: number | null;
    } | null = null;

    if (userId) {
      const { data: mine } = await supabase
        .from("daily_scores")
        .select("score, submitted_at")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      if (!mine) {
        my = { played: false, submitted: false, score: null, rank: null, total: null };
      } else {
        let rank: number | null = null;
        let total: number | null = null;
        if (mine.submitted_at && mine.score != null) {
          const { count: better } = await supabase
            .from("daily_scores")
            .select("id, users!inner(is_guest)", { count: "exact", head: true })
            .eq("date", date)
            .eq("users.is_guest", false)
            .not("submitted_at", "is", null)
            .gt("score", mine.score);
          const { count: cnt } = await supabase
            .from("daily_scores")
            .select("id, users!inner(is_guest)", { count: "exact", head: true })
            .eq("date", date)
            .eq("users.is_guest", false)
            .not("submitted_at", "is", null);
          rank = (better ?? 0) + 1;
          total = cnt ?? 1;
        }
        my = {
          played: true,
          submitted: Boolean(mine.submitted_at),
          score: mine.score ?? null,
          rank,
          total,
        };
      }
    }

    return NextResponse.json({
      date,
      entries,
      my,
      msUntilReset: msUntilKstMidnight(),
    });
  } catch (err) {
    console.error("GET /api/daily/leaderboard error:", err);
    return NextResponse.json(
      { error: "오늘의 랭킹을 불러오지 못했습니다" },
      { status: 500 }
    );
  }
};
