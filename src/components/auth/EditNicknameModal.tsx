"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { Spinner } from "@/components/common/Spinner";

const MAX_LEN = 12;

// 닉네임 변경 모달. 현재 닉네임을 미리 채우고, 1~12자로 변경한다.
export function EditNicknameModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const currentNickname = useAuthStore((s) => s.user?.nickname ?? "");
  const updateNickname = useAuthStore((s) => s.updateNickname);
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 열림 전환을 감지해 현재 닉네임으로 초기화 (effect 대신 렌더 중 상태 보정).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValue(currentNickname);
      setError(null);
    }
  }

  const close = () => {
    if (busy) return;
    onClose();
  };

  const handleSave = async () => {
    if (busy) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("auth.nickname.required"));
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(t("auth.nickname.tooLong"));
      return;
    }
    if (trimmed === currentNickname) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updateNickname(trimmed);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    setBusy(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t("auth.nickname.ariaLabel")}
        >
          <motion.div
            className="w-full max-w-sm bg-panel border border-edge rounded-2xl p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-snow font-bold text-base mb-1">
              {t("auth.nickname.title")}
            </h2>
            <p className="text-haze text-xs leading-relaxed mb-4">
              {t("auth.nickname.desc")}
            </p>

            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={t("auth.nickname.placeholder")}
              maxLength={MAX_LEN}
              className="w-full bg-void border border-edge rounded-xl px-3 py-2.5 text-snow text-sm placeholder:text-haze/60 focus:outline-none focus:border-neon-cyan mb-2"
              autoFocus
              disabled={busy}
              aria-label={t("auth.nickname.inputAria")}
            />

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <div className="flex gap-2 mt-3">
              <button
                onClick={close}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-sm transition-colors disabled:opacity-50"
              >
                {t("auth.delete.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={busy || !value.trim()}
                className="flex-1 py-2.5 rounded-xl bg-neon-cyan/90 hover:bg-neon-cyan text-void font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Spinner size="sm" colorClassName="border-void" />
                    {t("auth.nickname.saving")}
                  </>
                ) : (
                  t("auth.nickname.save")
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
