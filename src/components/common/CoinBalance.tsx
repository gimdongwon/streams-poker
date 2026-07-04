"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { Spinner } from "@/components/common/Spinner";

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
    if (claiming) return;
    setClaiming(true);
    const result = await claimDaily();
    if (result?.claimed) setCanClaim(false);
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
              <span>{t("coins.daily.reward")}</span>
              <span>{t("coins.daily.claim")}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
