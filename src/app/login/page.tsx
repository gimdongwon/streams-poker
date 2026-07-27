"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/stores/authStore";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/common/Logo";
import { isSocialEnabled } from "@/lib/socialAuth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AppleIcon } from "@/components/auth/AppleIcon";
import { useT } from "@/lib/i18n/useT";

const LoginPage = () => {
  const t = useT();
  const router = useRouter();
  const { isLoggedIn, forcedOut, clearForcedOut, hasHydrated, ensureSession, socialUpgrade } =
    useAuthStore();
  const [busy, setBusy] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const social = isSocialEnabled();
  const platform = Capacitor.getPlatform();

  // 소셜 로그인: 기존 연동 계정이 있으면 로그인, 없으면 새 계정 생성.
  // (게스트 세션이 있으면 같은 users.id 로 승격 — /api/auth/social 이 처리)
  const handleSocial = async (provider: "apple" | "google") => {
    if (busy) return;
    setSocialError(null);
    setBusy(true);
    const err = await socialUpgrade(provider);
    if (err) {
      setSocialError(err);
      setBusy(false);
      return;
    }
    router.replace("/lobby");
  };

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
    <div className="fixed inset-0 bg-void flex flex-col landscape:flex-row items-center justify-center gap-6 landscape:gap-10 p-4 overflow-y-auto overscroll-none">
      {/* 왼쪽: 브랜딩 + 게스트 진입 (가로에선 폼 옆, 세로에선 폼 위) */}
      <div className="w-full max-w-xs flex flex-col items-center gap-5">
        <Logo showSubtitle />

        <div className="w-full flex flex-col gap-2">
          {social && platform === "ios" && (
            <button
              onClick={() => handleSocial("apple")}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <AppleIcon />
              {t("auth.social.apple")}
            </button>
          )}
          {social && platform === "android" && (
            <button
              onClick={() => handleSocial("google")}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              {t("auth.social.google")}
            </button>
          )}
          {socialError && (
            <p className="text-red-400 text-xs text-center">{socialError}</p>
          )}

          <button
            onClick={startGuest}
            disabled={busy}
            className="w-full py-2.5 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-sm transition-colors disabled:opacity-50"
          >
            {busy ? t("auth.action.processing") : t("auth.guest.start")}
          </button>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 */}
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
      </div>
    </div>
  );
};

export default LoginPage;
