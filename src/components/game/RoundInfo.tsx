"use client";

import { TOTAL_ROUNDS } from "@/types/game";

type RoundInfoProps = {
  currentRound: number;
};

export const RoundInfo = ({ currentRound }: RoundInfoProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 text-[10px] font-medium">라운드</span>
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
            aria-label={`라운드 ${i + 1} ${i < currentRound ? "완료" : i === currentRound ? "진행중" : "대기"}`}
          />
        ))}
      </div>
      <span className="text-white font-bold text-xs">
        {currentRound}/{TOTAL_ROUNDS}
      </span>
    </div>
  );
};
