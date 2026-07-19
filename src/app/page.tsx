"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/stores/authStore";

// 진입 랜딩. 자동 게스트 생성 대신 "임시로 시작하기" 버튼으로 유도한다.
// 이미 세션 있으면(정식/게스트) 바로 로비로.
const Home = () => {
  const router = useRouter();
  const { user, hasHydrated, ensureSession } = useAuthStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasHydrated && user) router.replace("/lobby");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || user) return null;

  const startGuest = async () => {
    if (busy) return;
    setBusy(true);
    await ensureSession();
    if (useAuthStore.getState().user) router.replace("/lobby");
    else setBusy(false); // 생성 실패(오프라인 등) → 재시도 가능
  };

  return (
    <main className="min-h-[100dvh] bg-void flex flex-col items-center justify-center gap-10 p-6">
      <Logo size="lg" showSubtitle />
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={startGuest}
          disabled={busy}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-magenta text-void font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "시작하는 중…" : "회원가입 없이 임시로 시작하기"}
        </button>
        <Link
          href="/login"
          className="w-full py-3 rounded-2xl border border-edge text-haze hover:text-snow hover:bg-edge text-sm text-center transition-colors"
        >
          로그인
        </Link>
      </div>
    </main>
  );
};

export default Home;
