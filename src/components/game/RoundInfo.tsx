"use client";

import { TOTAL_ROUNDS } from "@/types/game";
import { useT } from "@/lib/i18n/useT";

type RoundInfoProps = {
  currentRound: number;
};

export const RoundInfo = ({ currentRound }: RoundInfoProps) => {
  const t = useT();
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 text-[10px] font-medium">{t("game.round.label")}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentRound
                ? "bg-green-500"
                : i === currentRound
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-gray-700"
            }`}
            aria-label={t("game.round.progress", {
              n: i + 1,
              status: i < currentRound ? t("game.round.done") : i === currentRound ? t("game.round.active") : t("game.round.pending"),
            })}
          />
        ))}
      </div>
      <span className="text-white font-bold text-xs">
        {currentRound}/{TOTAL_ROUNDS}
      </span>
    </div>
  );
};
