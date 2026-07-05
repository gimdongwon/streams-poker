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
