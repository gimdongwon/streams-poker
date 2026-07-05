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
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation: "landscape" });
  } catch {
    // 무시
  }
};

// 푸시 알림 등록: 권한 요청 → 토큰 발급 → 서버에 저장.
// (친구 요청 등 서버발 알림용. APNs/FCM 실제 발송은 서버 + 자격증명 필요)
export const registerPushForUser = async (userId: string): Promise<void> => {
  if (!isNative() || !userId) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;

    // 토큰 수신 리스너 등록 후 register 호출
    await PushNotifications.addListener("registration", async (token) => {
      try {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
          }),
        });
      } catch {
        // 저장 실패 무시
      }
    });

    await PushNotifications.register();
  } catch {
    // 미지원/네이티브 sync 전 무시
  }
};
