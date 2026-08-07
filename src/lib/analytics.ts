// Firebase Analytics (네이티브 전용). 브라우저에서는 no-op — 웹은 GA4가 담당.
// Apple 5.1.1(iv) 참고: IDFA 미사용 1차 분석이라 ATT 동의와 무관하게 허용된다.
// 개인정보 라벨에는 "제품 상호 작용(분석 목적, 사용자와 연결되지 않음)"으로 신고.
import { Capacitor } from "@capacitor/core";

type EventParams = Record<string, string | number>;

// 이벤트 기록. 실패해도 앱 흐름에 영향을 주지 않는다.
export const logEvent = async (
  name: string,
  params?: EventParams
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { FirebaseAnalytics } = await import("@capacitor-firebase/analytics");
    await FirebaseAnalytics.logEvent({ name, params });
  } catch (e) {
    console.warn("[Analytics] logEvent 실패:", e);
  }
};

// --- 주요 이벤트 헬퍼 (이름 오타 방지용) ---

export const logGameComplete = (mode: "single" | "multi" | "daily", score?: number) =>
  logEvent("game_complete", score != null ? { mode, score } : { mode });

export const logRoomCreate = () => logEvent("room_create");
export const logRoomJoin = () => logEvent("room_join");

export const logDailyRewardClaim = () => logEvent("daily_reward_claim");

export const logAdShown = (type: "rewarded" | "interstitial") =>
  logEvent("ad_shown", { type });

export const logLogin = (method: "guest" | "username" | "apple" | "google") =>
  logEvent("login", { method });
