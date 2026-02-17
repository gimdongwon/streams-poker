import type { Card, NormalCard, JokerCard } from "@/types/card";
import { SUITS, RANKS } from "@/types/card";

export const createDeck = (): Card[] => {
  const normalCards: NormalCard[] = SUITS.flatMap((suit) =>
    RANKS.map(
      (rank): NormalCard => ({
        type: "normal",
        suit,
        rank,
        id: `${suit}-${rank}`,
      })
    )
  );

  const jokerCards: JokerCard[] = [
    { type: "joker", jokerIndex: 1, id: "joker-1" },
    { type: "joker", jokerIndex: 2, id: "joker-2" },
  ];

  return [...normalCards, ...jokerCards];
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

export const drawCards = (deck: Card[], count: number): Card[] => {
  return deck.slice(0, count);
};

export const createGameDeck = (): Card[] => {
  const fullDeck = createDeck();
  const shuffled = shuffleDeck(fullDeck);
  return drawCards(shuffled, 10);
};
