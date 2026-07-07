import type { CapacitorConfig } from "@capacitor/cli";

// 방식 A: 원격 URL 웹뷰 래퍼.
// 네이티브 껍데기는 전체화면 웹뷰 하나이고, 모든 화면은 아래 server.url 의
// 호스팅된 사이트에서 그대로 로드된다. 네이티브는 광고/스플래시/상태바 등
// 기기 기능만 담당한다.
//
// server.url 은 인프라가 바뀌면(예: Fly.io 이전) 이 한 줄만 교체하면 된다.
const config: CapacitorConfig = {
  appId: "kr.tentens.app",
  appName: "TENTENS",
  // 원격 URL 로드 방식이라 webDir 내용은 런타임에 사용되지 않는 폴백이다.
  // (서버 미도달 시 표시될 최소 페이지)
  webDir: "capacitor-webdir",
  server: {
    url: "https://www.tentens.kr",
    androidScheme: "https",
    iosScheme: "https",
  },
  android: {
    // 원격 페이지 로드 전 잠깐 보이는 배경 (다크 테마와 맞춤)
    backgroundColor: "#0b0b12",
  },
  ios: {
    // 원격 로드 전/노치 영역 배경 (다크 테마와 맞춤)
    backgroundColor: "#0b0b12",
    // 스크롤 허용. (false 로 두면 마이페이지·개인정보처리방침 등 긴 페이지가
    //  스크롤되지 않는다. 게임/결과 화면은 고정 높이라 어차피 스크롤/바운스가 없음.)
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      // 원격 로드 대기 동안 스플래시 유지. 웹 마운트 시 CapacitorBootstrap가 hide() 호출.
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0b0b12",
      showSpinner: false,
      androidSpinnerStyle: "small",
    },
  },
};

export default config;
