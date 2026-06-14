"use client";

import { useEffect, useState } from "react";

// 휴대폰 크기의 작은 화면이면서 세로 방향일 때만 안내 오버레이를 노출한다.
// 세로 모드의 폰은 폭이 좁으므로 max-width로 판별한다(데스크톱/태블릿 제외).
const MEDIA_QUERY = "(orientation: portrait) and (max-width: 600px)";

export const OrientationGate = () => {
  // SSR/초기 렌더에서는 항상 숨김 → 하이드레이션 불일치 방지.
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(MEDIA_QUERY);

    const update = () => setShowPrompt(mql.matches);

    update();

    // 일부 구형 브라우저는 addEventListener를 지원하지 않을 수 있다.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }

    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  if (!showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="가로 모드 안내"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-void px-8 text-center"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-edge bg-panel">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neon-cyan"
          aria-hidden="true"
        >
          {/* 회전을 암시하는 화살표 */}
          <path d="M2 12a10 10 0 0 1 17-7.1L21 7" />
          <path d="M21 3v4h-4" />
          {/* 가로로 누운 휴대폰 */}
          <rect x="6" y="13.5" width="13" height="7.5" rx="1.5" />
          <line x1="8.5" y1="17.25" x2="8.5" y2="17.26" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-snow">가로로 돌려주세요</h2>
        <p className="text-sm text-haze">
          TENS는 가로 모드에서 즐길 수 있어요
        </p>
      </div>
    </div>
  );
};
