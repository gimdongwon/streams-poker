"use client";

import { motion } from "framer-motion";
import type { Card as CardType } from "@/types/card";
import { isJoker, SUIT_SYMBOLS } from "@/types/card";

type CardSize = "xs" | "sm" | "md" | "lg";

type CardProps = {
  card: CardType;
  size?: CardSize;
  isFlipped?: boolean;
  onClick?: () => void;
  className?: string;
};

// TENS duotone — red suits glow magenta, black suits glow cyan
const CYAN = "#2de2e6";
const MAGENTA = "#ff2e97";
const VOID = "#0b0e14";
const neonFor = (suit: "spade" | "heart" | "diamond" | "club"): string =>
  suit === "heart" || suit === "diamond" ? MAGENTA : CYAN;

const JOKER_GRADIENT = `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`;

type SizeSpec = {
  box: string;
  hero: string;
  rank: string;
  suit: string;
  border: number;
  jokerMark: string;
  jokerLabel: string;
};

const SIZE_MAP: Record<CardSize, SizeSpec> = {
  xs: { box: "w-[3.2rem] h-[4.5rem] rounded-md", hero: "text-xl", rank: "text-[9px]", suit: "text-[7px]", border: 1.5, jokerMark: "text-lg", jokerLabel: "text-[7px]" },
  sm: { box: "w-14 h-20 rounded-lg", hero: "text-2xl", rank: "text-[11px]", suit: "text-[9px]", border: 1.5, jokerMark: "text-2xl", jokerLabel: "text-[8px]" },
  md: { box: "w-20 h-28 rounded-xl", hero: "text-[2.6rem]", rank: "text-base", suit: "text-xs", border: 2, jokerMark: "text-4xl", jokerLabel: "text-[10px]" },
  lg: { box: "w-24 h-36 rounded-xl", hero: "text-6xl", rank: "text-lg", suit: "text-sm", border: 2, jokerMark: "text-5xl", jokerLabel: "text-xs" },
};

export const GameCard = ({
  card,
  size = "md",
  isFlipped = false,
  onClick,
  className = "",
}: CardProps) => {
  const s = SIZE_MAP[size];

  // Card back — gradient X tile on a panel
  if (isFlipped) {
    return (
      <div
        className={`${s.box} bg-panel border border-edge flex items-center justify-center ${className}`}
      >
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: "48%", height: "34%", background: JOKER_GRADIENT }}
        >
          <span className={`${s.jokerMark} font-extrabold leading-none`} style={{ color: VOID }}>
            X
          </span>
        </div>
      </div>
    );
  }

  // Joker — full-bleed gradient with X mark
  if (isJoker(card)) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${s.box} flex flex-col items-center justify-center cursor-pointer select-none ${className}`}
        style={{ background: JOKER_GRADIENT }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="조커 카드"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick?.();
        }}
      >
        <span className={`${s.jokerMark} font-extrabold leading-none`} style={{ color: VOID, letterSpacing: "-0.04em" }}>
          X
        </span>
        <span className={`${s.jokerLabel} font-extrabold tracking-[0.25em] mt-0.5`} style={{ color: VOID }}>
          JOKER
        </span>
      </motion.div>
    );
  }

  // Normal — dark panel, neon edge, hero numeral, corner rank+suit
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const neon = neonFor(card.suit);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${s.box} bg-panel relative flex items-center justify-center cursor-pointer select-none transition-shadow ${className}`}
      style={{ border: `${s.border}px solid ${neon}` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${suitSymbol}${card.rank} 카드`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <span
        className={`${s.hero} font-extrabold leading-none`}
        style={{ color: neon, letterSpacing: "-0.05em" }}
      >
        {card.rank}
      </span>
      <div className="absolute top-1 left-1 flex flex-col items-start leading-none">
        <span className={`${s.rank} font-extrabold text-snow leading-none`}>{card.rank}</span>
        <span className={`${s.suit} font-bold leading-none`} style={{ color: neon }}>
          {`${suitSymbol}︎`}
        </span>
      </div>
    </motion.div>
  );
};
