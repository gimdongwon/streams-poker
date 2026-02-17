import type { Card } from "./card";

export const TOTAL_ROUNDS = 10;
export const TOTAL_SLOTS = 10;
export const TIMER_SECONDS = 10;

export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Slot = {
  index: SlotIndex;
  card: Card | null;
};

export type GamePhase =
  | "idle"
  | "ready"
  | "playing"
  | "placing"
  | "round_end"
  | "game_over";

export type GameState = {
  phase: GamePhase;
  currentRound: number;
  currentCard: Card | null;
  slots: Slot[];
  deck: Card[];
  timer: number;
  score: number;
  combinations: ScoredCombination[];
};

export type CombinationType =
  | "royal_straight_flush"
  | "back_straight_flush"
  | "straight_flush"
  | "four_of_a_kind"
  | "mountain"
  | "full_house"
  | "back_straight"
  | "flush"
  | "straight"
  | "triple"
  | "two_pair"
  | "one_pair";

export type CombinationInfo = {
  type: CombinationType;
  name: string;
  score: number;
  rank: number;
};

export type ScoredCombination = CombinationInfo & {
  cards: Card[];
  slotIndices: number[];
};

export const COMBINATION_TABLE: CombinationInfo[] = [
  {
    type: "royal_straight_flush",
    name: "로열 스트레이트 플러시",
    score: 40,
    rank: 1,
  },
  {
    type: "back_straight_flush",
    name: "백 스트레이트 플러시",
    score: 30,
    rank: 2,
  },
  {
    type: "straight_flush",
    name: "스트레이트 플러시",
    score: 25,
    rank: 3,
  },
  { type: "four_of_a_kind", name: "포카드", score: 21, rank: 4 },
  { type: "mountain", name: "마운틴", score: 14, rank: 5 },
  { type: "full_house", name: "풀하우스", score: 15, rank: 6 },
  { type: "back_straight", name: "백스트레이트", score: 12, rank: 7 },
  { type: "flush", name: "플러시", score: 12, rank: 8 },
  { type: "straight", name: "스트레이트", score: 9, rank: 9 },
  { type: "triple", name: "트리플", score: 6, rank: 10 },
  { type: "two_pair", name: "투페어", score: 3, rank: 11 },
  { type: "one_pair", name: "원페어", score: 2, rank: 12 },
];

export const getCombinationInfo = (
  type: CombinationType
): CombinationInfo | undefined => {
  return COMBINATION_TABLE.find((c) => c.type === type);
};
