"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NOTICES, latestNotice, type Notice } from "@/lib/notices";
import { useI18nStore } from "@/stores/i18nStore";
import { useT } from "@/lib/i18n/useT";

const DISMISS_KEY = "tens-notice-dismissed"; // "다시 보지 않기" — 해제한 공지 id (영구)
const SESSION_CLOSED_KEY = "tens-notice-closed"; // 이 세션에서 닫음 (재노출 방지)

// 자동 노출 여부 판단 (로비 진입 시)
const shouldAutoShow = (): boolean => {
  if (typeof window === "undefined") return false;
  // 최신 공지가 autoShow일 때만 자동 팝업 (평상시엔 공지 아이콘으로만 열람)
  const latest = latestNotice();
  if (!latest.autoShow) return false;
  try {
    // "다시 보지 않기"를 누른 공지는 영구 미노출 (새 공지가 오면 id가 달라 다시 뜸)
    if (window.localStorage.getItem(DISMISS_KEY) === latest.id) return false;
    if (window.sessionStorage.getItem(SESSION_CLOSED_KEY) === latest.id) return false;
    return true;
  } catch {
    return false;
  }
};

// 공지사항 레이어 — 목록 + 상세 2단 구성.
// auto=true(로비)면 조건 충족 시 자동으로 뜬다. 수동은 open/onClose 로 제어.
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
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    if (!auto || !shouldAutoShow()) return;
    // 로비 진입 애니메이션과 겹치지 않게 살짝 지연 (동기 setState 린트 회피 겸)
    // 자동 노출은 최신 공지 상세부터 보여준다.
    const timer = setTimeout(() => {
      setSelected(latestNotice());
      setAutoOpen(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [auto]);

  const visible = auto ? autoOpen : Boolean(open);

  const close = () => {
    try {
      window.sessionStorage.setItem(SESSION_CLOSED_KEY, latestNotice().id);
    } catch {
      // ignore
    }
    setSelected(null); // 다음에 열 때 목록부터
    if (auto) setAutoOpen(false);
    onClose?.();
  };

  // 다시 보지 않기: 현재 최신 공지를 영구 해제 (새 공지 등록 시 다시 노출됨)
  const dismissForever = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, latestNotice().id);
    } catch {
      // ignore
    }
    setSelected(null);
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
              <h2 className="text-sm font-bold text-snow flex items-center gap-2 min-w-0">
                {selected ? (
                  <>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-haze hover:text-snow transition-colors shrink-0"
                      aria-label={t("notice.back")}
                    >
                      ‹
                    </button>
                    <span className="truncate">{selected.title[locale]}</span>
                  </>
                ) : (
                  <>📢 {t("notice.title")}</>
                )}
              </h2>
              <button
                onClick={close}
                className="w-7 h-7 rounded-full bg-edge hover:bg-edge/70 flex items-center justify-center text-haze hover:text-snow transition-colors text-xs shrink-0"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto min-h-0">
              {selected ? (
                // 상세
                <div className="p-5">
                  <p className="text-haze text-[10px] mb-1">{selected.date}</p>
                  <h3 className="text-snow text-sm font-bold mb-2">
                    {selected.title[locale]}
                  </h3>
                  <p className="text-haze text-xs leading-relaxed whitespace-pre-line">
                    {selected.body[locale]}
                  </p>
                </div>
              ) : (
                // 목록
                <ul className="divide-y divide-edge">
                  {NOTICES.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => setSelected(n)}
                        className="w-full px-5 py-3.5 text-left hover:bg-edge/50 transition-colors flex items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-snow text-sm font-medium truncate">
                            {n.title[locale]}
                          </p>
                          <p className="text-haze text-[10px] mt-0.5">{n.date}</p>
                        </div>
                        <span className="text-haze shrink-0">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-edge shrink-0 flex gap-2">
              <button
                onClick={dismissForever}
                className="flex-1 py-2.5 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-xs font-medium transition"
              >
                {t("notice.dismiss")}
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
