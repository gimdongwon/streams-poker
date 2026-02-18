export type LeaderboardEntry = {
  id: string;
  nickname: string;
  score: number;
  combinations: string[];
  combination_count: number;
  played_at: string;
};

export type LeaderboardInsert = {
  nickname: string;
  score: number;
  combinations: string[];
  combination_count: number;
};
