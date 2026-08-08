// 업적 정의 + 서버 판정 로직.
// 이름/설명 문자열은 i18n `ach.<id>.name` / `ach.<id>.desc` 키로 관리.
// 판정은 기존 데이터(leaderboard/user_rankings/users/friendships/daily_scores)만 사용 —
// 게임 흐름에 훅을 심지 않고, 업적 조회 시점에 평가·해금·보상 지급한다.

// 유저 통계 스냅샷 (서버에서 수집)
export type AchievementStats = {
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  // 역대 최고 조합 등급 (1=로열 … 12=원페어, 없으면 null)
  minComboRank: number | null;
  multiGames: number;
  dailyPlays: number;
  friends: number;
  dailyStreak: number;
};

export type AchievementDef = {
  id: string;
  emoji: string;
  reward: number;
  check: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_game", emoji: "🎮", reward: 50, check: (s) => s.gamesPlayed >= 1 },
  { id: "games_10", emoji: "🎯", reward: 100, check: (s) => s.gamesPlayed >= 10 },
  { id: "games_50", emoji: "🏃", reward: 200, check: (s) => s.gamesPlayed >= 50 },
  { id: "games_100", emoji: "💯", reward: 300, check: (s) => s.gamesPlayed >= 100 },
  { id: "best_100", emoji: "⚡", reward: 100, check: (s) => s.bestScore >= 100 },
  { id: "best_150", emoji: "🚀", reward: 200, check: (s) => s.bestScore >= 150 },
  { id: "total_1500", emoji: "💎", reward: 300, check: (s) => s.totalScore >= 1500 },
  { id: "combo_full_house", emoji: "🏠", reward: 50, check: (s) => s.minComboRank != null && s.minComboRank <= 5 },
  { id: "combo_four_kind", emoji: "🃏", reward: 100, check: (s) => s.minComboRank != null && s.minComboRank <= 4 },
  { id: "combo_straight_flush", emoji: "🌈", reward: 200, check: (s) => s.minComboRank != null && s.minComboRank <= 3 },
  { id: "combo_royal", emoji: "👑", reward: 500, check: (s) => s.minComboRank != null && s.minComboRank <= 1 },
  { id: "multi_first", emoji: "👥", reward: 50, check: (s) => s.multiGames >= 1 },
  { id: "daily_first", emoji: "📅", reward: 30, check: (s) => s.dailyPlays >= 1 },
  { id: "friend_first", emoji: "🤝", reward: 50, check: (s) => s.friends >= 1 },
  { id: "streak_7", emoji: "🔥", reward: 200, check: (s) => s.dailyStreak >= 7 },
];
