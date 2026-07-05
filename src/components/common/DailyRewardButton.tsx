"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { Spinner } from "@/components/common/Spinner";

type DailyRewardButtonProps = {
  className?: string;
};

// 일일 보상 받기 버튼 (하단 독립 배치용).
// 나중에 이 클릭에 AdMob 리워드 광고를 연결할 예정.
export const DailyRewardButton = ({
  className = "",
}: DailyRewardButtonProps) => {
  const t = useT();
  const refreshCoins = useAuthStore((s) => s.refreshCoins);
  const claimDaily = useAuthStore((s) => s.claimDaily);

  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let alive = true;
    refreshCoins().then((claimable) => {
      if (alive) setCanClaim(claimable);
    });
    return () => {
      alive = false;
    };
  }, [refreshCoins]);

  const handleClaim = useCallback(async () => {
    if (claiming || !canClaim) return;
    // TODO(admob): 여기서 리워드 광고를 먼저 노출한 뒤 보상 지급.
    setClaiming(true);
    const result = await claimDaily();
    if (result?.claimed) setCanClaim(false);
    setClaiming(false);
  }, [claiming, canClaim, claimDaily]);

  return (
    <button
      onClick={handleClaim}
      disabled={!canClaim || claiming}
      aria-label={t("coins.daily.claim")}
      className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-black/40 ${
        canClaim
          ? "text-void hover:scale-[1.02] animate-pulse"
          : "bg-panel border border-edge text-haze cursor-not-allowed"
      } ${className}`}
      style={
        canClaim
          ? { background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }
          : undefined
      }
    >
      {claiming ? (
        <Spinner size="sm" colorClassName="border-void" />
      ) : canClaim ? (
        <>
          <span className="text-base leading-none">🪙</span>
          <span>
            {t("coins.daily.claim")} ({t("coins.daily.reward")})
          </span>
        </>
      ) : (
        t("coins.daily.claimed")
      )}
    </button>
  );
};
