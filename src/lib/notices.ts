// 공지사항 목록. 새 공지는 배열 맨 앞에 추가 (id는 고유하게, 날짜 증가).
// 웹 배포만으로 앱에 즉시 반영된다.
export type Notice = {
  id: string; // 고유 ID (예: "2026-08-12-launch")
  date: string; // 표시용 날짜
  title: { ko: string; en: string };
  body: { ko: string; en: string };
};

export const NOTICES: Notice[] = [
  {
    id: "2026-08-19-coin-event",
    date: "2026.08.19",
    title: {
      ko: "🎉 출시 기념 코인 2배 이벤트",
      en: "🎉 Launch Event: Double Coins",
    },
    body: {
      ko: "8월 19일(수) 밤 10시부터 30분간, 멀티플레이 순위 보상 코인이 2배로 지급됩니다! (1등 +200 / 2등 +100 / 참가 +20)\n\n친구들과 방을 만들어 함께 즐겨보세요. 모아둔 코인의 활용처(상점 등)는 9월 내로 출시될 예정입니다. 많은 참여 부탁드려요!",
      en: "On Aug 19 (Wed) from 10:00 PM KST, multiplayer rank rewards are DOUBLED for 30 minutes! (1st +200 / 2nd +100 / play +20)\n\nGather your friends and join in. Ways to spend your coins (shop and more) are coming in September!",
    },
  },
  {
    id: "2026-08-12-launch",
    date: "2026.08.12",
    title: {
      ko: "TENTENS 정식 출시! 🎉",
      en: "TENTENS is officially live! 🎉",
    },
    body: {
      ko: "App Store와 Google Play에 정식 출시되었습니다. 매일 전 세계가 같은 덱으로 겨루는 '오늘의 덱', 업적과 연속 출석 보상까지 — 지금 바로 도전해보세요! 버그 제보와 피드백은 언제나 환영합니다.",
      en: "We're live on the App Store and Google Play. Try the Daily Deck — the same deck for everyone, once a day — plus achievements and streak rewards. Feedback is always welcome!",
    },
  },
];

// 가장 최신 공지
export const latestNotice = (): Notice => NOTICES[0];
