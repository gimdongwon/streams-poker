"use client";

import { motion } from "framer-motion";
import type { Slot as SlotType } from "@/types/game";
import type { SlotIndex } from "@/types/game";
import { GameCard } from "./Card";

type HighlightInfo = {
  ring: string;
  glow: string;
  text: string;
  label: string;
};

type SlotProps = {
  slot: SlotType;
  isActive: boolean;
  onPlace: (index: SlotIndex) => void;
  highlight?: HighlightInfo | null;
};

export const Slot = ({ slot, isActive, onPlace, highlight }: SlotProps) => {
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
            className={`absolute -inset-1 rounded-xl opacity-50 blur-sm z-0 shadow-lg ${highlight.glow}`}
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
          <GameCard card={slot.card} size="md" />
        </div>
        <div className="absolute -top-2 -left-1 bg-gray-700 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-20">
          {slot.index + 1}
        </div>
        {highlight && (
          <div
            className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap z-20 ${highlight.text}`}
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
      className={`w-20 h-28 rounded-lg border-2 border-dashed flex items-center justify-center relative transition-colors ${
        isActive
          ? "border-green-400 bg-green-400/10 cursor-pointer hover:bg-green-400/20"
          : "border-gray-600 bg-gray-800/30 cursor-not-allowed"
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`슬롯 ${slot.index + 1} ${isActive ? "배치 가능" : "비활성"}`}
    >
      <span
        className={`text-sm font-medium ${isActive ? "text-green-400" : "text-gray-600"}`}
      >
        {slot.index + 1}
      </span>
    </motion.div>
  );
};
