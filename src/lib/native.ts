// Capacitor 네이티브(iOS/Android 웹뷰)에서만 동작하는 기기 기능 래퍼.
// 브라우저에서는 isNativePlatform()가 false라 모두 no-op.
// 플러그인은 native 일 때만 동적 import 해서 SSR/브라우저 번들 영향 없음.
import { Capacitor } from "@capacitor/core";

export const isNative = (): boolean => Capacitor.isNativePlatform();

// 카드 배치 등 가벼운 촉각 피드백
export const hapticLight = async (): Promise<void> => {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // 미지원 기기 무시
  }
};

// 승리/성공 등 성공 알림 햅틱
export const hapticSuccess = async (): Promise<void> => {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // 무시
  }
};

// 가로모드 고정 (랜드스케이프 우선 게임)
export const lockLandscape = async (): Promise<void> => {
  if (!isNative()) return;
  // Android: 매니페스트 screenOrientation="sensorLandscape" 가 양쪽 가로(180° 회전 포함)를
  // 처리한다. 플러그인 lock('landscape')는 한쪽으로만 고정돼 회전이 안 되므로 안드로이드에선 생략.
  if (Capacitor.getPlatform() === "android") return;
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation: "landscape" });
  } catch {
    // 무시
  }
};

// 서버에 FCM 토큰 저장 (중복 저장은 서버 upsert가 처리)
const saveToken = async (userId: string, token: string): Promise<void> => {
  try {
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        token,
        platform: Capacitor.getPlatform(),
      }),
    });
  } catch {
    // 저장 실패 무시
  }
};

// 푸시 알림 등록: 권한 요청 → FCM 토큰 발급 → 서버에 저장.
// @capacitor-firebase/messaging 사용 → iOS·Android 모두 FCM 토큰을 반환하므로
// 서버(FCM HTTP v1) 단일 경로로 발송 가능. iOS 는 Firebase 가 APNs 연동을 자동 처리.
// (Firebase 콘솔에 APNs 인증키 업로드 + GoogleService-Info.plist 필요 — docs/ios-runbook.md)
export const registerPushForUser = async (userId: string): Promise<void> => {
  if (!isNative() || !userId) return;
  try {
    const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

    let perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await FirebaseMessaging.requestPermissions();
    }
    if (perm.receive !== "granted") return;

    // 토큰 갱신 리스너 (재발급 시 서버에 재저장)
    await FirebaseMessaging.addListener("tokenReceived", (event) => {
      if (event?.token) void saveToken(userId, event.token);
    });

    // 현재 토큰 즉시 발급 후 저장 (iOS 는 내부적으로 APNs 등록 완료를 대기)
    const { token } = await FirebaseMessaging.getToken();
    if (token) await saveToken(userId, token);
  } catch {
    // 미지원/네이티브 sync 전 무시
  }
};
