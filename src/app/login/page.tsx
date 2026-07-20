"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/common/Logo";
import { useT } from "@/lib/i18n/useT";

const LoginPage = () => {
  const t = useT();
  const router = useRouter();
  const { isLoggedIn, forcedOut, clearForcedOut, hasHydrated, ensureSession } =
    useAuthStore();
  const [busy, setBusy] = useState(false);

  const startGuest = async () => {
    if (busy) return;
    setBusy(true);
    await ensureSession();
    if (useAuthStore.getState().user) router.replace("/lobby");
    else setBusy(false); // 생성 실패(오프라인 등) → 재시도 가능
  };

  useEffect(() => {
    if (hasHydrated && isLoggedIn) {
      router.replace("/lobby");
    }
  }, [hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    return () => {
      if (forcedOut) clearForcedOut();
    };
  }, [forcedOut, clearForcedOut]);

  if (!hasHydrated || isLoggedIn) return null;

  return (
    <div className="fixed inset-0 bg-void flex flex-col landscape:flex-row items-center justify-center gap-4 landscape:gap-10 p-3 overflow-y-auto overscroll-none">
      <Logo showSubtitle />

      <div className="w-full max-w-sm flex flex-col">
        <AnimatePresence>
          {forcedOut && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center"
            >
              <p className="text-red-400 text-sm font-medium">
                {t("misc.login.forcedOut")}
              </p>
              <p className="text-red-400/60 text-xs mt-1">
                {t("misc.login.forcedOut.retry")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AuthForm mode="login" />

        <button
          onClick={startGuest}
          disabled={busy}
          className="w-full mt-4 py-3 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-sm transition-colors disabled:opacity-50"
        >
          {busy ? "시작하는 중…" : "회원가입 없이 임시로 시작하기"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
