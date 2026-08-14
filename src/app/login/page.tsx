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
import { FullScreenLoading } from "@/components/common/FullScreenLoading";
import { captureReferral } from "@/lib/referral";
import { Spinner } from "@/components/common/Spinner";

const LoginPage = () => {
  const t = useT();
  const router = useRouter();
  const { isLoggedIn, forcedOut, clearForcedOut, hasHydrated, ensureSession, socialUpgrade } =
    useAuthStore();
  const [busy, setBusy] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [showIdLogin, setShowIdLogin] = useState(false);
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

  // 초대 링크(?ref=)로 온 방문 기억 → 가입 시 보상 청구
  useEffect(() => {
    captureReferral();
  }, []);

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

  // 세션 확인 중이거나 로그인 직후 /lobby 전환 중 — 빈 화면 대신 로딩 표시.
  if (!hasHydrated || isLoggedIn) return <FullScreenLoading />;

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center p-4 overflow-y-auto overscroll-none">
      {/* 단일 중앙 컬럼: 브랜딩 + 시작/소셜. 아이디 로그인은 레이어(모달)로 접어둠 */}
      <div className="w-full max-w-xs flex flex-col items-center gap-5">
        {/* 강제 로그아웃 안내 */}
        <AnimatePresence>
          {forcedOut && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center"
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

        <Logo showSubtitle />

        <div className="w-full flex flex-col gap-2">
          {/* 주 진입: 게스트로 바로 시작 (게스트 중심 모델) */}
          <button
            onClick={startGuest}
            disabled={busy}
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            className="w-full py-3 rounded-xl text-void font-extrabold text-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? (
              <Spinner size="sm" colorClassName="border-void" />
            ) : (
              <>▶ {t("auth.guest.start")}</>
            )}
          </button>

          {/* 백업해둔 계정으로 복귀 (소셜 — 네이티브 전용) */}
          {social && (
            <>
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-edge" />
                <span className="text-haze text-[10px]">{t("auth.backupLogin.label")}</span>
                <div className="flex-1 h-px bg-edge" />
              </div>
              {platform === "ios" && (
                <button
                  onClick={() => handleSocial("apple")}
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AppleIcon />
                  {t("auth.social.apple")}
                </button>
              )}
              {platform === "android" && (
                <button
                  onClick={() => handleSocial("google")}
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  {t("auth.social.google")}
                </button>
              )}
            </>
          )}
          {socialError && (
            <p className="text-red-400 text-xs text-center whitespace-pre-wrap">{socialError}</p>
          )}

          {/* 아이디 로그인 (레거시/데모 계정용) — 텍스트 링크 → 레이어로 */}
          <button
            onClick={() => setShowIdLogin(true)}
            className="mt-2 text-haze hover:text-snow text-xs underline underline-offset-4 transition-colors"
            aria-label={t("auth.idLogin.link")}
          >
            {t("auth.idLogin.link")}
          </button>
        </div>
      </div>

      {/* 아이디 로그인 레이어 */}
      <AnimatePresence>
        {showIdLogin && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-8 py-6 bg-void/70 overflow-y-auto overscroll-contain safe-pad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIdLogin(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t("auth.login.title")}
          >
            <motion.div
              className="w-full max-w-sm my-auto"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AuthForm mode="login" />
              <button
                onClick={() => setShowIdLogin(false)}
                className="w-full mt-2 py-2 text-haze hover:text-snow text-xs font-medium rounded-xl transition-colors bg-panel border border-edge hover:bg-edge"
                aria-label={t("common.close")}
              >
                {t("common.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
