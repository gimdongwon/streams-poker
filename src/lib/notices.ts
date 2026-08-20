// 공지사항 목록. 새 공지는 배열 맨 앞에 추가 (id는 고유하게, 날짜 증가).
// 웹 배포만으로 앱에 즉시 반영된다.
// autoShow: true 인 공지가 맨 앞에 있을 때만 로비 진입 시 레이어 팝업이 자동으로 뜬다.
// (이벤트 종료 등으로 팝업을 내리려면 해당 공지를 삭제하거나 autoShow를 빼면 된다)
export type Notice = {
  id: string; // 고유 ID (예: "2026-08-12-launch")
  date: string; // 표시용 날짜
  autoShow?: boolean; // 로비 진입 시 자동 팝업 여부 (기본 false — 아이콘으로만 열람)
  title: { ko: string; en: string };
  body: { ko: string; en: string };
};

export const NOTICES: Notice[] = [
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
