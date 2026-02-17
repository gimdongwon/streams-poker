"use client";

import type {
  Slot as SlotType,
  SlotIndex,
  ScoredCombination,
} from "@/types/game";
import { Slot } from "./Slot";

type ComboStyle = {
  ring: string;
  glow: string;
  text: string;
  label: string;
};

const COMBO_STYLES: Record<string, ComboStyle> = {
  royal_straight_flush: {
    ring: "ring-amber-300",
    glow: "shadow-amber-400/50",
    text: "text-amber-300",
    label: "로티플",
  },
  back_straight_flush: {
    ring: "ring-fuchsia-400",
    glow: "shadow-fuchsia-400/50",
    text: "text-fuchsia-400",
    label: "백스플",
  },
  straight_flush: {
    ring: "ring-violet-400",
    glow: "shadow-violet-400/50",
    text: "text-violet-400",
    label: "스티플",
  },
  four_of_a_kind: {
    ring: "ring-rose-400",
    glow: "shadow-rose-400/50",
    text: "text-rose-400",
    label: "포카드",
  },
  mountain: {
    ring: "ring-teal-400",
    glow: "shadow-teal-400/50",
    text: "text-teal-400",
    label: "마운틴",
  },
  full_house: {
    ring: "ring-orange-400",
    glow: "shadow-orange-400/50",
    text: "text-orange-400",
    label: "풀하우스",
  },
  back_straight: {
    ring: "ring-lime-400",
    glow: "shadow-lime-400/50",
    text: "text-lime-400",
    label: "백스트",
  },
  flush: {
    ring: "ring-sky-400",
    glow: "shadow-sky-400/50",
    text: "text-sky-400",
    label: "플러시",
  },
  straight: {
    ring: "ring-emerald-400",
    glow: "shadow-emerald-400/50",
    text: "text-emerald-400",
    label: "스트레이트",
  },
  triple: {
    ring: "ring-yellow-400",
    glow: "shadow-yellow-400/50",
    text: "text-yellow-400",
    label: "트리플",
  },
  two_pair: {
    ring: "ring-indigo-400",
    glow: "shadow-indigo-400/50",
    text: "text-indigo-400",
    label: "투페어",
  },
  one_pair: {
    ring: "ring-slate-400",
    glow: "shadow-slate-400/40",
    text: "text-slate-400",
    label: "원페어",
  },
};

const DEFAULT_STYLE: ComboStyle = {
  ring: "ring-gray-400",
  glow: "shadow-gray-400/40",
  text: "text-gray-400",
  label: "",
};

type BoardProps = {
  slots: SlotType[];
  isActive: boolean;
  onPlace: (index: SlotIndex) => void;
  combinations?: ScoredCombination[];
  layout?: "row" | "grid";
};

export const Board = ({
  slots,
  isActive,
  onPlace,
  combinations = [],
  layout = "row",
}: BoardProps) => {
  const getHighlight = (slotIndex: number) => {
    for (const combo of combinations) {
      if (combo.slotIndices.includes(slotIndex)) {
        const style = COMBO_STYLES[combo.type] || DEFAULT_STYLE;
        return {
          ring: style.ring,
          glow: style.glow,
          text: style.text,
          label: style.label || combo.name,
        };
      }
    }
    return null;
  };

  const isGrid = layout === "grid";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">배치 슬롯</span>
        <span className="text-gray-500 text-xs">
          {slots.filter((s) => s.card !== null).length} / {slots.length} 배치됨
        </span>
      </div>
      <div
        className={
          isGrid
            ? "grid grid-cols-5 gap-2 justify-items-center pb-6"
            : "flex gap-2 flex-wrap justify-center pb-6"
        }
      >
        {slots.map((slot) => (
          <Slot
            key={slot.index}
            slot={slot}
            isActive={isActive}
            onPlace={onPlace}
            highlight={getHighlight(slot.index)}
          />
        ))}
      </div>
    </div>
  );
};
