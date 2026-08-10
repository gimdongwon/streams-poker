// 인앱 스토어 리뷰 요청 (네이티브 전용, 브라우저 no-op).
// 정책: 10판 이상 완료한 유저가 "기분 좋은 순간"(멀티 1등, 100점 이상)일 때 1회.
// 표시 여부/빈도는 OS가 최종 결정한다 (iOS 연 3회 제한 등) — 우리는 후보 순간만 고른다.
import { Capacitor } from "@capacitor/core";

const GAMES_KEY = "tens-review-games";
const ASKED_AT_KEY = "tens-review-asked-at";
// 한번 요청한 뒤 재요청까지의 최소 간격 (60일)
const REASK_INTERVAL_MS = 60 * 24 * 60 * 60 * 1000;
const MIN_GAMES = 10;

// 게임 1판 완료 기록 (모드 무관).
export const trackGameForReview = (): void => {
  if (typeof window === "undefined") return;
  try {
    const n = (parseInt(window.localStorage.getItem(GAMES_KEY) ?? "0", 10) || 0) + 1;
    window.localStorage.setItem(GAMES_KEY, String(n));
  } catch {
    // ignore
  }
};

// 조건이 맞으면 OS 리뷰 팝업 요청. 호출부는 "좋은 순간"에만 부른다.
export const maybeRequestReview = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || typeof window === "undefined") return;
  try {
    const games = parseInt(window.localStorage.getItem(GAMES_KEY) ?? "0", 10) || 0;
    if (games < MIN_GAMES) return;

    const askedAt = parseInt(window.localStorage.getItem(ASKED_AT_KEY) ?? "0", 10) || 0;
    if (Date.now() - askedAt < REASK_INTERVAL_MS) return;
    window.localStorage.setItem(ASKED_AT_KEY, String(Date.now()));

    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch {
    // 리뷰 요청 실패는 조용히 무시
  }
};
