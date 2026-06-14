// 게임 1판 기록 (history) 삽입용
export type LeaderboardInsert = {
  user_id: string;
  nickname: string;
  score: number;
  combinations: string[];
  combination_count: number;
  mode?: "single" | "multi";
};

// 유저별 누적 랭킹 (user_rankings 뷰)
export type UserRankingEntry = {
  user_id: string;
  nickname: string;
  total_score: number;
  games_played: number;
  best_score: number;
  last_played: string;
};

// 특정 유저의 누적 순위 정보
export type UserRankInfo = {
  rank: number | null;
  totalScore: number;
  gamesPlayed: number;
};
