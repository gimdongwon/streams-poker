export const SUITS = ["spade", "heart", "diamond", "club"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_VALUES: Record<Rank, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

export const SUIT_COLORS: Record<Suit, string> = {
  spade: "text-gray-900 dark:text-white",
  heart: "text-red-500",
  diamond: "text-red-500",
  club: "text-gray-900 dark:text-white",
};

export type NormalCard = {
  type: "normal";
  suit: Suit;
  rank: Rank;
  id: string;
};

export type JokerCard = {
  type: "joker";
  jokerIndex: 1 | 2;
  id: string;
};

export type Card = NormalCard | JokerCard;

export const isJoker = (card: Card): card is JokerCard => {
  return card.type === "joker";
};

export const isNormal = (card: Card): card is NormalCard => {
  return card.type === "normal";
};

export const getCardDisplayName = (card: Card): string => {
  if (isJoker(card)) return "JOKER";
  return `${SUIT_SYMBOLS[card.suit]}${card.rank}`;
};
