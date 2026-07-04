"use client";

import type { Slot as SlotType, SlotIndex } from "@/types/game";
import { Slot } from "./Slot";
import { COMBO_STYLES, DEFAULT_STYLE } from "@/lib/comboStyles";
import { useT } from "@/lib/i18n/useT";
import { comboKey } from "@/lib/i18n/combo";

// Minimal shape needed to highlight the board — ScoredCombination satisfies it,
// and so does the trimmed ResultCombo sent over the wire for other players.
export type BoardCombo = {
  type: string;
  name: string;
  slotIndices: number[];
};

type CardSize = "xs" | "sm" | "md" | "lg";

type BoardProps = {
  slots: SlotType[];
  isActive: boolean;
  onPlace: (index: SlotIndex) => void;
  combinations?: BoardCombo[];
  size?: CardSize;
  showHeader?: boolean;
  showComboLabels?: boolean;
};

export const Board = ({
  slots,
  isActive,
  onPlace,
  combinations = [],
  size = "md",
  showHeader = true,
  showComboLabels = true,
}: BoardProps) => {
  const t = useT();
  const getHighlight = (slotIndex: number) => {
    for (const combo of combinations) {
      if (combo.slotIndices.includes(slotIndex)) {
        const style = COMBO_STYLES[combo.type] || DEFAULT_STYLE;
        return {
          ring: style.ring,
          glow: style.glow,
          text: style.text,
          label: style.label || t(comboKey(combo.type)),
        };
      }
    }
    return null;
  };

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-haze text-[10px] font-medium">{t("game.board.slotsLabel")}</span>
          <span className="text-haze/70 text-[10px]">
            {slots.filter((s) => s.card !== null).length}/{slots.length}
          </span>
        </div>
      )}
      <div className={`grid grid-cols-5 gap-1.5 justify-items-center ${showComboLabels ? "pb-5" : "pb-1"}`}>
        {slots.map((slot) => (
          <Slot
            key={slot.index}
            slot={slot}
            isActive={isActive}
            onPlace={onPlace}
            highlight={getHighlight(slot.index)}
            size={size}
            showLabel={showComboLabels}
          />
        ))}
      </div>
    </div>
  );
};
