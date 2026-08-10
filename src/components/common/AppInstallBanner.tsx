"use client";

import { useSyncExternalStore, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useT } from "@/lib/i18n/useT";

const APP_STORE_URL = "https://apps.apple.com/app/id6792527133";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=kr.tentens.app";
// 안드로이드 프로덕션 공개 후 true 로 (심사 중엔 스토어 페이지가 404)
const PLAY_STORE_READY = false;

const emptySubscribe = () => () => {};

// 모바일 웹(비네이티브)에서만 노출되는 앱 설치 배너.
// Smart App Banner(meta)는 Safari 전용이라 카카오톡/라인 인앱 브라우저용으로 필요하다.
export const AppInstallBanner = () => {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  const platform = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (Capacitor.isNativePlatform()) return "native";
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      if (/Android/i.test(ua)) return "android";
      return "desktop";
    },
    () => "desktop"
  );

  if (dismissed || platform === "native" || platform === "desktop") return null;
  if (platform === "android" && !PLAY_STORE_READY) return null;

  const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 safe-pad">
      <div className="mx-auto max-w-md m-3 bg-panel border border-neon-cyan/40 rounded-2xl shadow-xl shadow-black/50 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl shrink-0">🃏</span>
        <div className="min-w-0 flex-1">
          <p className="text-snow text-xs font-bold truncate">{t("install.title")}</p>
          <p className="text-haze text-[11px] truncate">{t("install.desc")}</p>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-void text-xs font-extrabold px-3 py-2 rounded-xl active:scale-95 transition"
          style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
        >
          {t("install.cta")}
        </a>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t("common.close")}
          className="shrink-0 text-haze hover:text-snow text-sm p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
