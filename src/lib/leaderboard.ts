import { supabase } from "./supabase";
import type {
  LeaderboardInsert,
  LeaderboardSort,
  UserRankingEntry,
  UserRankInfo,
} from "@/types/leaderboard";

// 유저별 누적 랭킹 상위 N명. sort="score"면 누적 점수, "coins"면 보유 코인 기준.
// user_rankings 뷰(점수)와 users.coins 를 병합한 뒤 요청 기준으로 정렬한다.
export const fetchUserRankings = async (
  limit = 20,
  sort: LeaderboardSort = "score"
): Promise<UserRankingEntry[]> => {
  // 활성 플레이어 풀을 넉넉히 가져온 뒤(정렬은 아래서 확정) 코인을 병합한다.
  const pool = Math.max(limit, 100);
  const { data, error } = await supabase
    .from("user_rankings")
    .select("*")
    .order("total_score", { ascending: false })
    .order("games_played", { ascending: true })
    .limit(pool);

  if (error) throw error;
  const rows = (data ?? []) as Omit<UserRankingEntry, "coins">[];
  if (rows.length === 0) return [];

  // 해당 유저들의 코인 조회 → 맵으로 병합
  const ids = rows.map((r) => r.user_id);
  const { data: coinRows, error: coinErr } = await supabase
    .from("users")
    .select("id, coins")
    .in("id", ids);
  if (coinErr) throw coinErr;
  const coinMap = new Map<string, number>(
    (coinRows ?? []).map((c) => [c.id as string, (c.coins as number) ?? 0])
  );

  const merged: UserRankingEntry[] = rows.map((r) => ({
    ...r,
    coins: coinMap.get(r.user_id) ?? 0,
  }));

  merged.sort((a, b) =>
    sort === "coins"
      ? b.coins - a.coins || b.total_score - a.total_score
      : b.total_score - a.total_score || a.games_played - b.games_played
  );

  return merged.slice(0, limit);
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
