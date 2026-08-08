import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ACHIEVEMENTS, type AchievementStats } from "@/lib/achievements";

// GET /api/achievements?userId=
// 유저 통계를 수집해 미달성 업적을 평가하고, 새로 달성한 업적은
// 기록 + 코인 보상 지급 후 전체 목록을 반환한다.
export const GET = async (request: NextRequest) => {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
    }

    // --- 통계 수집 (병렬) ---
    const [rankingRes, comboRes, multiRes, dailyRes, friendsRes, userRes] =
      await Promise.all([
        supabase
          .from("user_rankings")
          .select("total_score, games_played, best_score")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("leaderboard")
          .select("best_combo_rank")
          .eq("user_id", userId)
          .not("best_combo_rank", "is", null)
          .order("best_combo_rank", { ascending: true })
          .limit(1),
        supabase
          .from("leaderboard")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("mode", "multi"),
        supabase
          .from("daily_scores")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("submitted_at", "is", null),
        supabase
          .from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
        supabase
          .from("users")
          .select("daily_streak")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    const stats: AchievementStats = {
      gamesPlayed: rankingRes.data?.games_played ?? 0,
      totalScore: Number(rankingRes.data?.total_score ?? 0),
      bestScore: rankingRes.data?.best_score ?? 0,
      minComboRank: comboRes.data?.[0]?.best_combo_rank ?? null,
      multiGames: multiRes.count ?? 0,
      dailyPlays: dailyRes.count ?? 0,
      friends: friendsRes.count ?? 0,
      dailyStreak: userRes.data?.daily_streak ?? 0,
    };

    // --- 기존 달성 내역 ---
    const { data: unlockedRows, error: unlockedErr } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);
    if (unlockedErr) throw unlockedErr;

    const unlockedMap = new Map(
      (unlockedRows ?? []).map((r) => [r.achievement_id as string, r.unlocked_at as string])
    );

    // --- 신규 달성 평가 + 보상 지급 ---
    const newlyUnlocked: string[] = [];
    for (const def of ACHIEVEMENTS) {
      if (unlockedMap.has(def.id)) continue;
      if (!def.check(stats)) continue;

      const { error: insErr } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, achievement_id: def.id, reward: def.reward });
      // UNIQUE 위반(동시 요청)이면 이미 처리된 것 — 보상 중복 지급 방지
      if (insErr) {
        if (insErr.code === "23505") continue;
        throw insErr;
      }

      try {
        await supabase.rpc("add_coins", { uid: userId, amount: def.reward });
      } catch {
        // 보상 지급 실패해도 달성 기록은 유지 (다음 조회에서 재지급하지 않음)
      }
      newlyUnlocked.push(def.id);
      unlockedMap.set(def.id, new Date().toISOString());
    }

    const list = ACHIEVEMENTS.map((def) => ({
      id: def.id,
      emoji: def.emoji,
      reward: def.reward,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) ?? null,
      isNew: newlyUnlocked.includes(def.id),
    }));

    return NextResponse.json({
      achievements: list,
      newlyUnlocked,
      newReward: newlyUnlocked.reduce(
        (sum, id) => sum + (ACHIEVEMENTS.find((d) => d.id === id)?.reward ?? 0),
        0
      ),
    });
  } catch (err) {
    console.error("GET /api/achievements error:", err);
    return NextResponse.json(
      { error: "업적을 불러오지 못했습니다" },
      { status: 500 }
    );
  }
};
