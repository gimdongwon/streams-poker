// AdMob (Capacitor 네이티브 전용). 브라우저에서는 no-op.
import { Capacitor } from "@capacitor/core";

// AdMob 리워드 광고 단위 ID (실제, 새 계정 pub-1157070050571953).
// 앱 ID(~)는 네이티브(Info.plist/AndroidManifest)에 설정.
const REWARDED_AD_ID = {
  ios: "ca-app-pub-1157070050571953/2495101707",
  android: "ca-app-pub-1157070050571953/2437472942",
};

// Google 공식 "테스트" 리워드 광고 단위 ID — 계정 승인/필과 무관하게 항상 노출.
// 개발·검증 전용. (본인 실광고 클릭 방지에도 안전)
const TEST_REWARDED_AD_ID = {
  ios: "ca-app-pub-3940256099942544/1245815016",
  android: "ca-app-pub-3940256099942544/5224354917",
};

let initialized = false;

export const initAdMob = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || initialized) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize();
    // iOS ATT + UMP 동의 요청 (광고 개인화/추적 동의)
    try {
      await AdMob.requestTrackingAuthorization();
    } catch {
      // 미지원/거절 무시
    }
    initialized = true;
  } catch (e) {
    console.error("[AdMob] initialize 실패:", e);
  }
};

export type RewardOutcome = "rewarded" | "dismissed" | "unavailable";

// 리워드 광고 노출. 광고를 못 띄우면 "unavailable" → 호출부에서 보상은 그대로 진행(사용자 불이익 방지).
// opts.test=true 면 Google 공식 테스트 광고로 노출(계정 승인 전 검증용).
export const showRewardedAd = async (
  opts?: { test?: boolean }
): Promise<RewardOutcome> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn("[AdMob] 네이티브 플랫폼이 아님 → unavailable (브라우저/시뮬레이터)");
    return "unavailable";
  }
  try {
    // 초기화가 안 됐으면 먼저 시도
    if (!initialized) await initAdMob();

    const { AdMob } = await import("@capacitor-community/admob");
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    const adId = opts?.test
      ? TEST_REWARDED_AD_ID[platform]
      : REWARDED_AD_ID[platform];

    console.log(`[AdMob] prepare 시작 (test=${!!opts?.test}, adId=${adId})`);
    await AdMob.prepareRewardVideoAd({ adId, isTesting: !!opts?.test });
    const reward = await AdMob.showRewardVideoAd();
    console.log("[AdMob] show 완료:", reward);
    return reward ? "rewarded" : "dismissed";
  } catch (e) {
    console.error("[AdMob] 리워드 광고 실패:", e);
    return "unavailable";
  }
};
