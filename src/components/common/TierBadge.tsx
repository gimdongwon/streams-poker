"use client";

import { getTier } from "@/lib/tier";
import { useT } from "@/lib/i18n/useT";

type TierBadgeProps = {
  totalScore: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

// 누적 점수 → 티어 배지. 색은 티어 색을 테두리/텍스트/은은한 배경에 사용.
export const TierBadge = ({
  totalScore,
  size = "sm",
  showLabel = true,
  className = "",
}: TierBadgeProps) => {
  const t = useT();
  const tier = getTier(totalScore);
  const dot = size === "md" ? "w-2.5 h-2.5" : "w-2 h-2";
  const text = size === "md" ? "text-xs" : "text-[10px]";
  const pad = size === "md" ? "px-2 py-1" : "px-1.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${pad} font-bold ${text} ${className}`}
      style={{
        color: tier.color,
        backgroundColor: `${tier.color}1f`, // ~12% alpha
        border: `1px solid ${tier.color}66`,
      }}
      aria-label={t("tier.badgeAria", { label: tier.label })}
    >
      <span className={`${dot} rounded-full`} style={{ backgroundColor: tier.color }} />
      {showLabel && tier.label}
    </span>
  );
};
