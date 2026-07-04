"use client";

import { getTier, nextTier } from "@/lib/tier";
import { useT } from "@/lib/i18n/useT";

type TierProgressProps = {
  totalScore: number;
  // 라벨/카드 없이 얇은 바만 렌더 (헤더 등 좁은 곳용)
  bare?: boolean;
  className?: string;
};

// 누적 점수 기반 티어 진행도(경험치 바). 현재 티어 → 다음 티어까지 남은 점수.
export const TierProgress = ({
  totalScore,
  bare = false,
  className = "",
}: TierProgressProps) => {
  const t = useT();
  const current = getTier(totalScore);
  const next = nextTier(totalScore);

  const progress =
    next && next.next.min > current.min
      ? Math.min(
          100,
          Math.round(
            ((totalScore - current.min) / (next.next.min - current.min)) * 100
          )
        )
      : 100;

  const barBackground = `linear-gradient(90deg, ${current.color}, ${
    next ? next.next.color : current.color
  })`;

  if (bare) {
    return (
      <div
        className={`h-1 w-full rounded-full bg-edge overflow-hidden ${className}`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress}%`, background: barBackground }}
        />
      </div>
    );
  }

  return (
    <div className="bg-panel/60 border border-edge rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-extrabold"
          style={{ color: current.color }}
        >
          {current.label}
        </span>
        {next ? (
          <span
            className="text-xs font-bold"
            style={{ color: next.next.color }}
          >
            {next.next.label}
          </span>
        ) : (
          <span className="text-xs font-bold text-neon-cyan">
            {t("me.tier.max")}
          </span>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-edge overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${current.color}, ${
              next ? next.next.color : current.color
            })`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-haze mt-2">
        <span>{t("unit.points", { n: totalScore })}</span>
        <span>
          {next
            ? t("me.tier.toNext", { tier: next.next.label, n: next.remaining })
            : t("me.tier.max")}
        </span>
      </div>
    </div>
  );
};
