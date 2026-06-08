import type { CardData } from "./types";

const SUITS = ["spade", "heart", "diamond", "club"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const createGameDeck = (): CardData[] => {
  const deck: CardData[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ type: "normal", suit, rank, id: `${suit}-${rank}` });
    }
  }
  deck.push({ type: "joker", jokerIndex: 1, id: "joker-1" });
  deck.push({ type: "joker", jokerIndex: 2, id: "joker-2" });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, 10);
};
