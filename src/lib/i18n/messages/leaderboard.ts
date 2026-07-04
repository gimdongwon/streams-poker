import type { Namespace } from "./common";

// 이 네임스페이스의 문자열. ko/en 양쪽에 같은 키를 추가한다.
export const leaderboard: Namespace = {
  ko: {
    "leaderboard.title": "누적 랭킹",
    "leaderboard.col.nickname": "닉네임",
    "leaderboard.col.totalScore": "누적점수",
    "leaderboard.col.games": "판수",
    "leaderboard.error": "랭킹을 불러올 수 없습니다",
    "leaderboard.empty": "아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!",
    "leaderboard.best": "최고 {n}점",
  },
  en: {
    "leaderboard.title": "Overall Ranking",
    "leaderboard.col.nickname": "Nickname",
    "leaderboard.col.totalScore": "Total",
    "leaderboard.col.games": "Games",
    "leaderboard.error": "Couldn't load the ranking",
    "leaderboard.empty": "No records yet. Be the first to set one!",
    "leaderboard.best": "Best {n}",
  },
};
