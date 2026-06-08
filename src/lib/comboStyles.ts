// Per-combination visual styles, shared by the board highlight rings and the
// result-screen breakdown chips so the two read as one linked system.

export type ComboStyle = {
  ring: string; // tailwind ring color for board highlight
  glow: string; // shadow color for the glow layer
  text: string; // text color (breakdown label, slot caption)
  dot: string; // background color for the breakdown chip dot
  label: string; // short label shown under the board slot
};

export const COMBO_STYLES: Record<string, ComboStyle> = {
  royal_straight_flush: { ring: "ring-amber-300", glow: "shadow-amber-400/50", text: "text-amber-300", dot: "bg-amber-300", label: "로티플" },
  back_straight_flush: { ring: "ring-fuchsia-400", glow: "shadow-fuchsia-400/50", text: "text-fuchsia-400", dot: "bg-fuchsia-400", label: "백스플" },
  straight_flush: { ring: "ring-violet-400", glow: "shadow-violet-400/50", text: "text-violet-400", dot: "bg-violet-400", label: "스티플" },
  four_of_a_kind: { ring: "ring-rose-400", glow: "shadow-rose-400/50", text: "text-rose-400", dot: "bg-rose-400", label: "포카드" },
  mountain: { ring: "ring-teal-400", glow: "shadow-teal-400/50", text: "text-teal-400", dot: "bg-teal-400", label: "마운틴" },
  full_house: { ring: "ring-orange-400", glow: "shadow-orange-400/50", text: "text-orange-400", dot: "bg-orange-400", label: "풀하우스" },
  back_straight: { ring: "ring-lime-400", glow: "shadow-lime-400/50", text: "text-lime-400", dot: "bg-lime-400", label: "백스트" },
  flush: { ring: "ring-sky-400", glow: "shadow-sky-400/50", text: "text-sky-400", dot: "bg-sky-400", label: "플러시" },
  straight: { ring: "ring-emerald-400", glow: "shadow-emerald-400/50", text: "text-emerald-400", dot: "bg-emerald-400", label: "스트레이트" },
  triple: { ring: "ring-yellow-400", glow: "shadow-yellow-400/50", text: "text-yellow-400", dot: "bg-yellow-400", label: "트리플" },
  two_pair: { ring: "ring-indigo-400", glow: "shadow-indigo-400/50", text: "text-indigo-400", dot: "bg-indigo-400", label: "투페어" },
  one_pair: { ring: "ring-slate-400", glow: "shadow-slate-400/40", text: "text-slate-400", dot: "bg-slate-400", label: "원페어" },
};

export const DEFAULT_STYLE: ComboStyle = {
  ring: "ring-gray-400",
  glow: "shadow-gray-400/40",
  text: "text-gray-400",
  dot: "bg-gray-400",
  label: "",
};

export const getComboStyle = (type: string): ComboStyle =>
  COMBO_STYLES[type] || DEFAULT_STYLE;
