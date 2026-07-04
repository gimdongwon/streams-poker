import { supabase } from "./supabase";
import type {
  LeaderboardInsert,
  UserRankingEntry,
  UserRankInfo,
} from "@/types/leaderboard";

// 유저별 누적 랭킹 상위 N명 (total_score 내림차순)
export const fetchUserRankings = async (
  limit = 20
): Promise<UserRankingEntry[]> => {
  const { data, error } = await supabase
    .from("user_rankings")
    .select("*")
    .order("total_score", { ascending: false })
    .order("games_played", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

// 게임 1판 결과를 기록(history)에 저장 → 뷰가 자동으로 누적 합산
export const submitScore = async (entry: LeaderboardInsert): Promise<void> => {
  const { error } = await supabase.from("leaderboard").insert(entry);
  if (error) throw error;
};

// 특정 유저의 누적 점수/순위 조회
export const fetchUserRank = async (userId: string): Promise<UserRankInfo> => {
  const { data: me, error: meErr } = await supabase
    .from("user_rankings")
    .select("total_score, games_played, best_score, best_combo")
    .eq("user_id", userId)
    .maybeSingle();

  if (meErr) throw meErr;
  if (!me)
    return {
      rank: null,
      totalScore: 0,
      gamesPlayed: 0,
      bestScore: 0,
      bestCombo: null,
    };

  const { count, error: rankErr } = await supabase
    .from("user_rankings")
    .select("*", { count: "exact", head: true })
    .gt("total_score", me.total_score);

  if (rankErr) throw rankErr;

  return {
    rank: (count ?? 0) + 1,
    totalScore: me.total_score,
    gamesPlayed: me.games_played,
    bestScore: me.best_score ?? 0,
    bestCombo: me.best_combo ?? null,
  };
};
