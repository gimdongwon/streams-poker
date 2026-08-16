"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NOTICES, latestNotice } from "@/lib/notices";
import { useI18nStore } from "@/stores/i18nStore";
import { useT } from "@/lib/i18n/useT";

const HIDE_UNTIL_KEY = "tens-notice-hide-until"; // "하루동안 보지 않기" 만료 시각
const SESSION_CLOSED_KEY = "tens-notice-closed"; // 이 세션에서 닫음 (재노출 방지)

// 자동 노출 여부 판단 (로비 진입 시)
const shouldAutoShow = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const hideUntil = parseInt(window.localStorage.getItem(HIDE_UNTIL_KEY) ?? "0", 10) || 0;
    if (Date.now() < hideUntil) return false;
    if (window.sessionStorage.getItem(SESSION_CLOSED_KEY) === latestNotice().id) return false;
    return true;
  } catch {
    return false;
  }
};

// 공지사항 레이어. auto=true(로비)면 조건 충족 시 자동으로 뜬다.
// 아이콘 등에서 수동으로 열 때는 open/onClose 로 제어.
export const NoticeModal = ({
  open,
  onClose,
  auto = false,
}: {
  open?: boolean;
  onClose?: () => void;
  auto?: boolean;
}) => {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (!auto || !shouldAutoShow()) return;
    // 로비 진입 애니메이션과 겹치지 않게 살짝 지연 (동기 setState 린트 회피 겸)
    const timer = setTimeout(() => setAutoOpen(true), 400);
    return () => clearTimeout(timer);
  }, [auto]);

  const visible = auto ? autoOpen : Boolean(open);

  const close = () => {
    try {
      window.sessionStorage.setItem(SESSION_CLOSED_KEY, latestNotice().id);
    } catch {
      // ignore
    }
    if (auto) setAutoOpen(false);
    onClose?.();
  };

  const hideForDay = () => {
    try {
      window.localStorage.setItem(
        HIDE_UNTIL_KEY,
        String(Date.now() + 24 * 60 * 60 * 1000)
      );
    } catch {
      // ignore
    }
    if (auto) setAutoOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-center justify-center px-8 py-6 bg-void/70 overflow-y-auto overscroll-contain safe-pad"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t("notice.title")}
        >
          <motion.div
            className="w-full max-w-sm my-auto max-h-[85dvh] bg-panel border border-edge rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge shrink-0">
              <h2 className="text-sm font-bold text-snow flex items-center gap-2">
                📢 {t("notice.title")}
              </h2>
              <button
                onClick={close}
                className="w-7 h-7 rounded-full bg-edge hover:bg-edge/70 flex items-center justify-center text-haze hover:text-snow transition-colors text-xs"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto min-h-0 space-y-4">
              {NOTICES.map((n) => (
                <div key={n.id}>
                  <p className="text-haze text-[10px] mb-1">{n.date}</p>
                  <h3 className="text-snow text-sm font-bold mb-1.5">
                    {n.title[locale]}
                  </h3>
                  <p className="text-haze text-xs leading-relaxed whitespace-pre-line">
                    {n.body[locale]}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-3.5 border-t border-edge shrink-0 flex gap-2">
              <button
                onClick={hideForDay}
                className="flex-1 py-2.5 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-xs font-medium transition"
              >
                {t("notice.hideToday")}
              </button>
              <button
                onClick={close}
                style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
                className="flex-1 py-2.5 rounded-xl text-void text-xs font-extrabold transition active:scale-95"
              >
                {t("common.close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
