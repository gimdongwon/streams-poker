"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@/types/card";
import { isJoker, SUIT_SYMBOLS, SUIT_COLORS } from "@/types/card";

type CardSize = "xs" | "sm" | "md" | "lg";

type CardProps = {
  card: CardType;
  size?: CardSize;
  isFlipped?: boolean;
  onClick?: () => void;
  className?: string;
};

const SIZE_MAP: Record<CardSize, string> = {
  xs: "w-[3.2rem] h-[4.5rem] text-[10px]",
  sm: "w-14 h-20 text-xs",
  md: "w-20 h-28 text-sm",
  lg: "w-24 h-36 text-base",
};

export const GameCard = ({
  card,
  size = "md",
  isFlipped = false,
  onClick,
  className = "",
}: CardProps) => {
  if (isFlipped) {
    return (
      <div
        className={`${SIZE_MAP[size]} rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 shadow-lg flex items-center justify-center ${className}`}
      >
        <div className="w-3/4 h-3/4 rounded border border-blue-400/50 bg-blue-700/50 flex items-center justify-center">
          <span className="text-blue-300 font-bold text-lg">♠</span>
        </div>
      </div>
    );
  }

  if (isJoker(card)) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${SIZE_MAP[size]} rounded-lg bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 border-2 border-yellow-300 shadow-lg shadow-yellow-500/30 flex flex-col items-center justify-center cursor-pointer select-none ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="조커 카드"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick?.();
        }}
      >
        <span className={`text-white font-black drop-shadow-md ${size === "xs" ? "text-sm" : "text-lg"}`}>
          ★
        </span>
        <span className={`text-white font-bold tracking-wider ${size === "xs" ? "text-[8px]" : "text-[10px] mt-0.5"}`}>
          JOKER
        </span>
      </motion.div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const colorClass = SUIT_COLORS[card.suit];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${SIZE_MAP[size]} rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg flex flex-col items-center justify-between ${size === "xs" ? "p-1" : "p-1.5"} cursor-pointer select-none hover:shadow-xl transition-shadow ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${suitSymbol}${card.rank} 카드`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className={`self-start font-bold ${colorClass}`}>
        <div className="leading-none">{card.rank}</div>
        <div className={`leading-none ${size === "xs" ? "text-[8px]" : "text-[10px]"}`}>{suitSymbol}</div>
      </div>
      <div className={`${size === "xs" ? "text-base" : "text-2xl"} ${colorClass}`}>{suitSymbol}</div>
      <div className={`self-end font-bold rotate-180 ${colorClass}`}>
        <div className="leading-none">{card.rank}</div>
        <div className={`leading-none ${size === "xs" ? "text-[8px]" : "text-[10px]"}`}>{suitSymbol}</div>
      </div>
    </motion.div>
  );
};
