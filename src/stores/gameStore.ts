import { create } from "zustand";
import type { Card } from "@/types/card";
import type {
  GamePhase,
  Slot,
  SlotIndex,
  ScoredCombination,
} from "@/types/game";
import { TOTAL_ROUNDS, TOTAL_SLOTS, TIMER_SECONDS } from "@/types/game";
import { createGameDeck } from "@/lib/poker/deck";
import { playSound } from "@/lib/sound";

type GameStore = {
  phase: GamePhase;
  currentRound: number;
  currentCard: Card | null;
  slots: Slot[];
  deck: Card[];
  timer: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  score: number;
  combinations: ScoredCombination[];

  startGame: () => void;
  startGameWithDeck: (deck: Card[]) => void;
  placeCard: (slotIndex: SlotIndex) => void;
  autoPlaceCard: () => void;
  nextRound: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  endGame: () => void;
  resetGame: () => void;
  setScore: (score: number) => void;
  setCombinations: (combinations: ScoredCombination[]) => void;
};

const createEmptySlots = (): Slot[] => {
  return Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    index: i as SlotIndex,
    card: null,
  }));
};

export const useGameStore = create<GameStore>((set, get) => ({
  phase: "idle",
  currentRound: 0,
  currentCard: null,
  slots: createEmptySlots(),
  deck: [],
  timer: TIMER_SECONDS,
  timerInterval: null,
  score: 0,
  combinations: [],

  startGame: () => {
    const deck = createGameDeck();
    set({
      phase: "playing",
      currentRound: 1,
      currentCard: deck[0],
      slots: createEmptySlots(),
      deck,
      timer: TIMER_SECONDS,
      score: 0,
      combinations: [],
    });
    get().startTimer();
  },

  startGameWithDeck: (deck: Card[]) => {
    set({
      phase: "playing",
      currentRound: 1,
      currentCard: deck[0],
      slots: createEmptySlots(),
      deck,
      timer: TIMER_SECONDS,
      score: 0,
      combinations: [],
    });
    get().startTimer();
  },

  placeCard: (slotIndex: SlotIndex) => {
    const { currentCard, slots, phase } = get();
    if (phase !== "playing" || !currentCard) return;
    if (slots[slotIndex].card !== null) return;

    const newSlots = slots.map((slot) =>
      slot.index === slotIndex ? { ...slot, card: currentCard } : slot
    );

    get().stopTimer();
    set({ slots: newSlots, currentCard: null, phase: "round_end" });
    playSound("place");
  },

  autoPlaceCard: () => {
    const { slots, phase } = get();
    if (phase !== "playing") return;

    const emptySlots = slots.filter((slot) => slot.card === null);
    if (emptySlots.length === 0) return;

    const randomSlot =
      emptySlots[Math.floor(Math.random() * emptySlots.length)];
    get().placeCard(randomSlot.index);
  },

  nextRound: () => {
    const { currentRound, deck, phase } = get();

    if (phase !== "round_end") return;

    if (currentRound >= TOTAL_ROUNDS) {
      get().endGame();
      return;
    }

    const nextRound = currentRound + 1;
    const nextCard = deck[nextRound - 1];

    set({
      phase: "playing",
      currentRound: nextRound,
      currentCard: nextCard,
      timer: TIMER_SECONDS,
    });

    get().startTimer();
  },

  startTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    const interval = setInterval(() => {
      get().tickTimer();
    }, 1000);

    set({ timerInterval: interval, timer: TIMER_SECONDS });
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  tickTimer: () => {
    const { timer, phase } = get();
    if (timer <= 1) {
      get().stopTimer();
      get().autoPlaceCard();
      return;
    }
    const next = timer - 1;
    if (phase === "playing" && next >= 1 && next <= 3) {
      playSound("warning");
    }
    set({ timer: next });
  },

  endGame: () => {
    get().stopTimer();
    set({ phase: "game_over", currentCard: null });
  },

  resetGame: () => {
    get().stopTimer();
    set({
      phase: "idle",
      currentRound: 0,
      currentCard: null,
      slots: createEmptySlots(),
      deck: [],
      timer: TIMER_SECONDS,
      timerInterval: null,
      score: 0,
      combinations: [],
    });
  },

  setScore: (score: number) => set({ score }),
  setCombinations: (combinations: ScoredCombination[]) => set({ combinations }),
}));
