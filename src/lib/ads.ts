// AdMob (Capacitor 네이티브 전용). 브라우저에서는 no-op.
import { Capacitor } from "@capacitor/core";

// AdMob 리워드 광고 단위 ID (실제, 새 계정 pub-1157070050571953).
// 앱 ID(~)는 네이티브(Info.plist/AndroidManifest)에 설정.
const REWARDED_AD_ID = {
  ios: "ca-app-pub-1157070050571953/2495101707",
  android: "ca-app-pub-1157070050571953/2437472942",
};

// AdMob 전면 광고 단위 ID (실제, pub-1157070050571953).
// TODO(android): AdMob 콘솔에서 Android 전면 광고 단위 생성 후 채우기. 빈 값이면 실광고는 건너뛴다.
const INTERSTITIAL_AD_ID = {
  ios: "ca-app-pub-1157070050571953/5559579867",
  android: "",
};

// Google 공식 "테스트" 리워드 광고 단위 ID — 계정 승인/필과 무관하게 항상 노출.
// 개발·검증 전용. (본인 실광고 클릭 방지에도 안전)
const TEST_REWARDED_AD_ID = {
  ios: "ca-app-pub-3940256099942544/1245815016",
  android: "ca-app-pub-3940256099942544/5224354917",
};

// Google 공식 "테스트" 전면 광고 단위 ID.
const TEST_INTERSTITIAL_AD_ID = {
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
};

let initialized = false;

export const initAdMob = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || initialized) return;
  try {
    const { AdMob, AdmobConsentStatus } = await import("@capacitor-community/admob");
    await AdMob.initialize();

    // iOS ATT (추적 허용 요청). 미지원/거절은 무시.
    try {
      await AdMob.requestTrackingAuthorization();
    } catch {
      // ignore
    }

    // Google UMP(CMP) 동의 — EEA/영국/스위스 유저에게만 동의 폼이 뜬다.
    // 그 외 지역은 status=NOT_REQUIRED 라 아무것도 표시되지 않는다.
    // 동의 흐름 실패가 광고/게임을 막으면 안 되므로 별도 try.
    try {
      const consentInfo = await AdMob.requestConsentInfo();
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdmobConsentStatus.REQUIRED
      ) {
        await AdMob.showConsentForm();
      }
    } catch (e) {
      console.warn("[AdMob] 동의(UMP) 흐름 실패 — 무시하고 진행:", e);
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

// --- 전면 광고 (게임 사이 자연 휴지기 전용) ---

// 전면 광고 노출. 실패/미설정 시 "unavailable" — 호출부는 그대로 진행해야 한다(게임 흐름을 막지 않기).
export const showInterstitialAd = async (
  opts?: { test?: boolean }
): Promise<"shown" | "unavailable"> => {
  if (!Capacitor.isNativePlatform()) return "unavailable";
  try {
    if (!initialized) await initAdMob();

    const { AdMob } = await import("@capacitor-community/admob");
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    const adId = opts?.test
      ? TEST_INTERSTITIAL_AD_ID[platform]
      : INTERSTITIAL_AD_ID[platform];
    if (!adId) {
      console.warn("[AdMob] 전면 광고 단위 미설정 → skip");
      return "unavailable";
    }

    console.log(`[AdMob] interstitial prepare (test=${!!opts?.test}, adId=${adId})`);
    await AdMob.prepareInterstitial({ adId, isTesting: !!opts?.test });
    await AdMob.showInterstitial();
    console.log("[AdMob] interstitial show 완료");
    return "shown";
  } catch (e) {
    console.error("[AdMob] 전면 광고 실패:", e);
    return "unavailable";
  }
};

// --- 게임 완료 빈도 기반 전면 광고 ---
// 싱글 게임 N판 완료마다 + 최소 간격을 지켜 전면 광고 1회.
// 카운터는 localStorage 에 보관(브라우저에선 no-op이라 영향 없음).

// 전면 광고 활성 스위치.
const INTERSTITIAL_ENABLED = true;

const AD_GAMES_KEY = "tens-ad-game-count";
const AD_LAST_SHOWN_KEY = "tens-ad-last-shown";
const GAMES_PER_AD = 3; // 3판마다 1회
const MIN_AD_INTERVAL_MS = 3 * 60 * 1000; // 최소 3분 간격

// 게임 1판 완료를 기록하고, 조건이 차면 전면 광고를 띄운다.
// 광고를 못 띄워도(미설정/실패) 흐름은 그대로 진행되며, 그 경우 카운터는 유지해 다음 기회에 다시 시도한다.
export const maybeShowInterstitialAfterGame = async (
  opts?: { test?: boolean }
): Promise<void> => {
  if (!INTERSTITIAL_ENABLED) return; // 광고 단위 발급 전까지 완전 비활성
  if (!Capacitor.isNativePlatform() || typeof window === "undefined") return;
  try {
    const count = (parseInt(window.localStorage.getItem(AD_GAMES_KEY) ?? "0", 10) || 0) + 1;
    window.localStorage.setItem(AD_GAMES_KEY, String(count));
    if (count < GAMES_PER_AD) return;

    const last = parseInt(window.localStorage.getItem(AD_LAST_SHOWN_KEY) ?? "0", 10) || 0;
    if (Date.now() - last < MIN_AD_INTERVAL_MS) return;

    const outcome = await showInterstitialAd(opts);
    if (outcome === "shown") {
      window.localStorage.setItem(AD_GAMES_KEY, "0");
      window.localStorage.setItem(AD_LAST_SHOWN_KEY, String(Date.now()));
    }
  } catch {
    // 광고 빈도 로직 실패는 게임 흐름에 영향 주지 않는다.
  }
};
