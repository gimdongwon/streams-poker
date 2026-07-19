"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/stores/authStore";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/common/Logo";
import { isSocialEnabled } from "@/lib/socialAuth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AppleIcon } from "@/components/auth/AppleIcon";

const RegisterPage = () => {
  const router = useRouter();
  const { isLoggedIn, hasHydrated, socialUpgrade } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const social = isSocialEnabled();
  const platform = Capacitor.getPlatform();

  useEffect(() => {
    if (hasHydrated && isLoggedIn) {
      router.replace("/lobby");
    }
  }, [hasHydrated, isLoggedIn, router]);

  if (!hasHydrated || isLoggedIn) return null;

  const handleSocial = async (provider: "apple" | "google") => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const err = await socialUpgrade(provider);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    router.replace("/lobby");
  };

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center p-3 landscape:py-2 overflow-y-auto overscroll-none">
      <Logo showSubtitle className="mb-6 landscape:mb-3" />

      <AuthForm mode="signup" />

      {social && (
        <div className="w-full max-w-sm mt-4 flex flex-col gap-2">
          {platform === "ios" && (
            <button
              onClick={() => handleSocial("apple")}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <AppleIcon />
              Apple로 계속하기
            </button>
          )}
          {platform === "android" && (
            <button
              onClick={() => handleSocial("google")}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>
          )}
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
