"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";

// 계정 삭제 확인 모달. 비밀번호를 재확인하고, 성공하면 로그인 화면으로 보낸다.
// 삭제는 되돌릴 수 없으며 전적/친구 관계도 함께 삭제된다.
export function DeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setPassword("");
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (busy) return;
    setError(null);
    if (!password) {
      setError(t("auth.delete.password.required"));
      return;
    }
    setBusy(true);
    const err = await deleteAccount(password);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    // 삭제 성공 → 로그인 화면으로
    router.push("/login");
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
          aria-label={t("auth.delete.ariaLabel")}
        >
          <motion.div
            className="w-full max-w-sm bg-panel border border-edge rounded-2xl p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-snow font-bold text-base mb-1">
              {t("auth.delete.title")}
            </h2>
            <p className="text-haze text-xs leading-relaxed mb-4">
              {t("auth.delete.warning.prefix")}
              <span className="text-red-400">
                {t("auth.delete.warning.highlight")}
              </span>
              {t("auth.delete.warning.suffix")}
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              placeholder={t("auth.delete.password.placeholder")}
              className="w-full bg-void border border-edge rounded-xl px-3 py-2.5 text-snow text-sm placeholder:text-haze/60 focus:outline-none focus:border-haze mb-2"
              autoFocus
              disabled={busy}
              aria-label={t("auth.delete.password.ariaLabel")}
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
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {busy ? t("auth.delete.deleting") : t("auth.delete.confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
