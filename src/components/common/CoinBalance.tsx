"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { Spinner } from "@/components/common/Spinner";
import { showRewardedAd } from "@/lib/ads";

type CoinBalanceProps = {
  // 일일 보상 버튼 노출 여부
  showDaily?: boolean;
  className?: string;
};

// 코인 잔액 칩 + (수령 가능 시) 일일 보상 받기 버튼.
export const CoinBalance = ({
  showDaily = true,
  className = "",
}: CoinBalanceProps) => {
  const t = useT();
  const coins = useAuthStore((s) => s.user?.coins ?? 0);
  const refreshCoins = useAuthStore((s) => s.refreshCoins);
  const claimDaily = useAuthStore((s) => s.claimDaily);

  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState(0);
  const [nextReward, setNextReward] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    refreshCoins().then((state) => {
      if (!alive || !state) return;
      setCanClaim(state.canClaimDaily);
      setStreak(state.streak);
      setNextReward(state.nextReward);
    });
    return () => {
      alive = false;
    };
  }, [refreshCoins]);

  const handleClaim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    // 네이티브: 리워드 광고 노출 후 보상. 광고 실패("unavailable")여도 보상은 진행.
    await showRewardedAd();
    const result = await claimDaily();
    if (result?.claimed) {
      setCanClaim(false);
      if (result.streak != null) setStreak(result.streak);
    }
    setClaiming(false);
  }, [claiming, claimDaily]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex items-center gap-1 bg-panel/60 border border-edge rounded-xl px-2.5 py-1.5 shrink-0"
        aria-label={t("coins.label")}
      >
        <span className="text-base leading-none">🪙</span>
        <span className="text-snow font-bold text-xs tabular-nums">
          {coins.toLocaleString()}
        </span>
      </span>

      {/* 연속 출석 표시 (2일 이상) */}
      {streak >= 2 && (
        <span
          className="inline-flex items-center bg-panel/60 border border-edge rounded-xl px-2 py-1.5 text-[10px] text-haze font-bold shrink-0"
          aria-label={t("coins.streak", { n: streak })}
        >
          {t("coins.streak", { n: streak })}
        </span>
      )}

      {showDaily && canClaim && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-void text-[11px] font-extrabold shrink-0 active:scale-95 transition disabled:opacity-60 animate-pulse"
          style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
          aria-label={t("coins.daily.claim")}
        >
          {claiming ? (
            <Spinner size="sm" colorClassName="border-void" />
          ) : (
            <>
              <span>+{nextReward ?? 100}</span>
              <span>{t("coins.daily.claim")}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
