"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/common/Logo";

const RegisterPage = () => {
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && isLoggedIn) {
      router.replace("/lobby");
    }
  }, [hasHydrated, isLoggedIn, router]);

  if (!hasHydrated || isLoggedIn) return null;

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex flex-col items-center justify-center p-3 landscape:py-2 overflow-auto">
      <Logo showSubtitle className="mb-6 landscape:mb-3" />

      <AuthForm mode="signup" />
    </div>
  );
};

export default RegisterPage;
