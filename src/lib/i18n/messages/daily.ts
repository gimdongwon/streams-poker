import type { Namespace } from "./common";

// 오늘의 덱 (데일리 챌린지) 문자열.
export const daily: Namespace = {
  ko: {
    "daily.title": "오늘의 덱",
    "daily.desc": "매일 모두 같은 덱 · 하루 한 번 · 참여 +20 코인",
    "daily.done": "오늘 {score}점 · {rank}위",
    "daily.aria": "오늘의 덱 도전",
    "daily.empty": "아직 아무도 도전하지 않았어요. 오늘의 1등을 노려보세요!",
    "leaderboard.tab.all": "누적",
    "leaderboard.tab.daily": "오늘",
  },
  en: {
    "daily.title": "Daily Deck",
    "daily.desc": "Same deck for everyone · once a day · +20 coins",
    "daily.done": "Today {score} pts · #{rank}",
    "daily.aria": "Play the Daily Deck",
    "daily.empty": "No one has played yet. Claim today's #1!",
    "leaderboard.tab.all": "All-time",
    "leaderboard.tab.daily": "Today",
  },
};
