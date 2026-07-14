"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// 앱 진입 시 세션 보장 — 세션이 없으면 익명 게스트 세션을 만든다.
// 익명 우선 전략: 아무도 입구에서 로그인 벽을 만나지 않고, 멀티 입구에서만 정식 계정을 요구한다.
// 로그인/회원가입 페이지에서는 게스트 자동 생성을 하지 않는다(명시적 인증 흐름 존중).
const AUTH_PATHS = ["/login", "/register"];

export function SessionBootstrap() {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const ensureSession = useAuthStore((s) => s.ensureSession);

  useEffect(() => {
    if (!hasHydrated || user) return;
    if (AUTH_PATHS.some((p) => pathname?.startsWith(p))) return;
    ensureSession();
  }, [hasHydrated, user, pathname, ensureSession]);

  return null;
}
