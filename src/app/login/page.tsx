"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/common/Logo";

const LoginPage = () => {
  const router = useRouter();
  const { isLoggedIn, forcedOut, clearForcedOut, hasHydrated } = useAuthStore();

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
    <div className="min-h-[100dvh] bg-gray-900 flex flex-col items-center justify-center p-3 landscape:py-2 overflow-auto">
      <Logo showSubtitle className="mb-6 landscape:mb-3" />

      <AnimatePresence>
        {forcedOut && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-red-400 text-sm font-medium">
              다른 곳에서 로그인되어 자동 로그아웃되었습니다
            </p>
            <p className="text-red-400/60 text-xs mt-1">
              다시 로그인해주세요
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthForm mode="login" />
    </div>
  );
};

export default LoginPage;
