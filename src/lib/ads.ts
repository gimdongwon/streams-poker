// AdMob (Capacitor 네이티브 전용). 브라우저에서는 no-op.
// 현재 Google 공식 "테스트" 광고 단위 ID 사용 — 출시 전 실제 ID로 교체할 것.
import { Capacitor } from "@capacitor/core";

// AdMob 리워드 광고 단위 ID (실제). 앱 ID(~)는 네이티브(Info.plist/AndroidManifest)에 설정.
const REWARDED_AD_ID = {
  ios: "ca-app-pub-1157070050571953/2495101707",
  android: "ca-app-pub-1157070050571953/2437472942",
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
  } catch {
    // 플러그인 미탑재(네이티브 sync 전) 등 무시
  }
};

export type RewardOutcome = "rewarded" | "dismissed" | "unavailable";

// 리워드 광고 노출. 광고를 못 띄우면 "unavailable" → 호출부에서 보상은 그대로 진행(사용자 불이익 방지).
export const showRewardedAd = async (): Promise<RewardOutcome> => {
  if (!Capacitor.isNativePlatform()) return "unavailable";
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    const adId =
      Capacitor.getPlatform() === "ios"
        ? REWARDED_AD_ID.ios
        : REWARDED_AD_ID.android;
    await AdMob.prepareRewardVideoAd({ adId });
    const reward = await AdMob.showRewardVideoAd();
    return reward ? "rewarded" : "dismissed";
  } catch {
    return "unavailable";
  }
};
