"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";

const GA_TRACKING_ID = "G-TFPP8C8KDJ";
const GTM_ID = "GTM-TRMPCGCZ";

// GA4 + GTM 로더 — 웹 브라우저 방문자 전용.
// 네이티브 앱(Capacitor 웹뷰)에서는 절대 로드하지 않는다.
// Apple 5.1.1(iv): ATT "추적 안 함" 선택 후에도 웹뷰가 추적 쿠키(_ga 등)를
// 수집하면 리젝된다. 앱 내 분석이 필요해지면 ATT 동의 상태와 연동해야 한다.
const emptySubscribe = () => () => {};

export const AnalyticsScripts = () => {
  // SSR에선 false → 클라이언트에서 웹 브라우저일 때만 true.
  const isWeb = useSyncExternalStore(
    emptySubscribe,
    () => !Capacitor.isNativePlatform(),
    () => false
  );

  if (!isWeb) return null;

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>
    </>
  );
};
