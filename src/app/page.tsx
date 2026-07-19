"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// 진입 리다이렉트: 세션(정식/게스트) 있으면 /lobby, 없으면 /login.
const Home = () => {
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(isLoggedIn ? "/lobby" : "/login");
  }, [hasHydrated, isLoggedIn, router]);

  return null;
};

export default Home;
