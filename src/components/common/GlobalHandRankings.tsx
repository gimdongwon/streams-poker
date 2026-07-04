"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandRankingsButton } from "@/components/game/HandRankingsModal";
import { useT } from "@/lib/i18n/useT";

const HIDDEN_PATHS = ["/login", "/register"];

export const GlobalHandRankings = () => {
  const pathname = usePathname();
  const t = useT();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* 개인정보처리방침 (족보 버튼 오른쪽) */}
      <div className="fixed bottom-4 left-[4.5rem] z-40 group">
        <Link
          href="/privacy"
          aria-label={t("hands.privacy")}
          className="w-11 h-11 rounded-full bg-panel border border-edge hover:bg-edge hover:border-neon-cyan/50 flex items-center justify-center transition-all shadow-lg shadow-black/30 hover:scale-110 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-haze"
          >
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            <path d="M9.5 12l1.8 1.8 3.4-3.8" />
          </svg>
        </Link>
        {/* 툴팁 */}
        <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1 bg-edge text-snow text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-edge">
          {t("hands.privacy")}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#232b3d]" />
        </div>
      </div>

      <HandRankingsButton />
    </>
  );
};
