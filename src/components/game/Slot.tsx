"use client";

import { motion } from "framer-motion";
import type { Slot as SlotType } from "@/types/game";
import type { SlotIndex } from "@/types/game";
import { GameCard } from "./Card";
import { useT } from "@/lib/i18n/useT";

type HighlightInfo = {
  ring: string;
  glow: string;
  text: string;
  label: string;
};

type CardSize = "xs" | "sm" | "md" | "lg";

type SlotProps = {
  slot: SlotType;
  isActive: boolean;
  onPlace: (index: SlotIndex) => void;
  highlight?: HighlightInfo | null;
  size?: CardSize;
  showLabel?: boolean;
};

const EMPTY_SIZE_MAP: Record<CardSize, string> = {
  xs: "w-[3.2rem] h-[4.5rem]",
  sm: "w-14 h-20",
  md: "w-20 h-28",
  lg: "w-24 h-36",
};

const BADGE_SIZE_MAP: Record<CardSize, string> = {
  xs: "w-4 h-4 text-[8px] -top-1.5 -right-0.5",
  sm: "w-5 h-5 text-[10px] -top-2 -right-1",
  md: "w-6 h-6 text-xs -top-2.5 -right-1",
  lg: "w-6 h-6 text-xs -top-2 -right-1",
};

export const Slot = ({ slot, isActive, onPlace, highlight, size = "xs", showLabel = true }: SlotProps) => {
  const t = useT();
  const hasCard = slot.card !== null;

  const handleClick = () => {
    if (!hasCard && isActive) {
      onPlace(slot.index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !hasCard && isActive) {
      onPlace(slot.index);
    }
  };

  if (hasCard && slot.card) {
    return (
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="relative"
      >
        {highlight && (
          <div
            className={`absolute -inset-0.5 rounded-xl opacity-50 blur-sm z-0 shadow-lg ${highlight.glow}`}
            style={{
              background: `radial-gradient(circle, var(--tw-shadow-color) 0%, transparent 70%)`,
            }}
          />
        )}
        <div
          className={`relative z-10 rounded-lg ${
            highlight
              ? `ring-2 ring-offset-1 ring-offset-gray-900 ${highlight.ring}`
              : ""
          }`}
        >
          <GameCard card={slot.card} size={size} />
        </div>
        <div className={`absolute bg-edge text-snow font-bold rounded-full flex items-center justify-center z-20 ring-1 ring-white/10 ${BADGE_SIZE_MAP[size]}`}>
          {slot.index + 1}
        </div>
        {highlight && showLabel && (
          <div
            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 font-bold whitespace-nowrap z-20 ${size === "xs" ? "text-[7px]" : "text-[9px]"} ${highlight.text}`}
          >
            {highlight.label}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={isActive ? { scale: 1.05 } : {}}
      whileTap={isActive ? { scale: 0.95 } : {}}
      className={`${EMPTY_SIZE_MAP[size]} rounded-lg border-2 border-dashed flex items-center justify-center relative transition-colors ${
        isActive
          ? "border-neon-cyan bg-neon-cyan/10 cursor-pointer hover:bg-neon-cyan/20"
          : "border-edge bg-panel/40 cursor-not-allowed"
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={t("game.slot.label", {
        n: slot.index + 1,
        status: isActive ? t("game.slot.placeable") : t("game.slot.inactive"),
      })}
    >
      <span
        className={`font-medium ${size === "xs" ? "text-xs" : "text-sm"} ${isActive ? "text-neon-cyan" : "text-haze/60"}`}
      >
        {slot.index + 1}
      </span>
    </motion.div>
  );
};
