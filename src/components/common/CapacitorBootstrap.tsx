"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { lockLandscape } from "@/lib/native";

// 네이티브(Capacitor) 웹뷰에서만 동작하는 기기 기능 배선.
// 브라우저에서는 isNativePlatform()가 false라 아무 것도 하지 않는다(no-op).
// 방식 A(원격 URL 래퍼)이므로 이 코드는 tentens.kr에 배포되어야 APK 웹뷰에 반영된다.
export function CapacitorBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 상태바: Style.Dark = 어두운 배경용(밝은 아이콘). 다크 테마와 맞춤.
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === "android") {
      StatusBar.setBackgroundColor({ color: "#0b0b12" }).catch(() => {});
    }

    // 가로모드 우선 게임 → 네이티브에서 가로로 고정.
    lockLandscape();

    // 원격 페이지 로드 완료(이 컴포넌트 마운트) 후 스플래시 해제.
    SplashScreen.hide().catch(() => {});

    // 안드로이드 하드웨어 뒤로가기: 웹 히스토리가 있으면 뒤로, 루트면 앱 종료.
    const subPromise = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      subPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);

  return null;
}
