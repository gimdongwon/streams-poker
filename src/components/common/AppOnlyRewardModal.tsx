"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

const APP_STORE_URL = "https://apps.apple.com/app/id6792527133";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=kr.tentens.app";

// Android: 앱이 설치돼 있으면 앱 링크로 열고, 없으면 Play 스토어로 폴백.
const ANDROID_INTENT_URL = `intent://www.tentens.kr/lobby#Intent;scheme=https;package=kr.tentens.app;S.browser_fallback_url=${encodeURIComponent(
  PLAY_STORE_URL
)};end`;

// 웹에서 일일 보상 클릭 시: "앱에서만 보상 수령 가능" 안내 + 앱/스토어 연결.
// (보상은 리워드 광고 시청과 묶여 있어 앱 전용 — 웹은 체험판 포지션)
export const AppOnlyRewardModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const t = useT();

  const handleOpenApp = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/Android/i.test(ua)) {
      window.location.href = ANDROID_INTENT_URL;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      // iOS 웹: 같은 도메인에선 유니버설 링크가 발동하지 않아 App Store 로 —
      // 설치돼 있으면 스토어에서 '열기' 버튼으로 앱 진입.
      window.location.href = APP_STORE_URL;
    } else {
      // 데스크톱: 스토어 페이지 새 탭
      window.open(APP_STORE_URL, "_blank", "noopener");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-8 py-6 bg-void/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("reward.appOnly.title")}
        >
          <motion.div
            className="w-full max-w-xs bg-panel border border-edge rounded-2xl p-6 shadow-xl text-center"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-3xl" aria-hidden="true">
              🪙
            </span>
            <h2 className="text-snow font-bold text-base mt-2 mb-1.5">
              {t("reward.appOnly.title")}
            </h2>
            <p className="text-haze text-xs leading-relaxed mb-4">
              {t("reward.appOnly.desc")}
            </p>
            <button
              onClick={handleOpenApp}
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
              className="w-full py-3 rounded-xl text-void text-sm font-extrabold transition-all active:scale-95 hover:scale-[1.01]"
            >
              📲 {t("reward.appOnly.cta")}
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-haze hover:text-snow text-xs transition-colors"
            >
              {t("common.close")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
