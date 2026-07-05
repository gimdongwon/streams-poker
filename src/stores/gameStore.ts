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
import { hapticLight } from "@/lib/native";

// --- 재접속 시 자신의 보드 복원을 위한 로컬 스냅샷 ---
// sessionStorage 의 활성 방 코드와 연동하여 방 단위로 localStorage 에 저장한다.
const ACTIVE_ROOM_KEY = "tens-active-room";
const boardSnapshotKey = (code: string) => `tens-board-${code}`;

type BoardSnapshot = {
  code: string;
  deck: Card[];
  currentRound: number;
  slots: Slot[];
};

const getActiveRoomCode = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string };
    return parsed.code ?? null;
  } catch {
    return null;
  }
};

const writeBoardSnapshot = (snapshot: BoardSnapshot) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(boardSnapshotKey(snapshot.code), JSON.stringify(snapshot));
  } catch {
    // ignore quota / serialization errors
  }
};

const readBoardSnapshot = (code: string): BoardSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(boardSnapshotKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as BoardSnapshot;
  } catch {
    return null;
  }
};

const clearBoardSnapshot = (code: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(boardSnapshotKey(code));
  } catch {
    // ignore
  }
};

// 현재 보드 상태를 활성 방 코드로 스냅샷 저장 (멀티 진행 중일 때만 의미 있음).
const persistBoardSnapshot = (deck: Card[], currentRound: number, slots: Slot[]) => {
  const code = getActiveRoomCode();
  if (!code) return;
  writeBoardSnapshot({ code, deck, currentRound, slots });
};

export type ResyncPayload = {
  code: string;
  status: "waiting" | "playing" | "finished";
  deck: Card[];
  currentRound: number;
};

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
  resyncGame: (payload: ResyncPayload) => void;
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
    const slots = createEmptySlots();
    set({
      phase: "playing",
      currentRound: 1,
      currentCard: deck[0],
      slots,
      deck,
      timer: TIMER_SECONDS,
      score: 0,
      combinations: [],
    });
    persistBoardSnapshot(deck, 1, slots);
    get().startTimer();
  },

  // 재접속: 서버의 현재 라운드로 게임에 복귀한다. 스냅샷이 같은 방+라운드면
  // 직접 배치한 카드를 복원하고, 아니면 해당 라운드의 빈 보드로 시작한다.
  resyncGame: (payload: ResyncPayload) => {
    const { code, status, deck, currentRound } = payload;
    if (status !== "playing" || !deck || deck.length === 0 || currentRound < 1) return;

    get().stopTimer();

    const snapshot = readBoardSnapshot(code);
    const slots =
      snapshot && snapshot.code === code && snapshot.currentRound === currentRound
        ? snapshot.slots
        : createEmptySlots();

    set({
      phase: "playing",
      currentRound,
      currentCard: deck[currentRound - 1] ?? null,
      slots,
      deck,
      timer: TIMER_SECONDS,
    });
    persistBoardSnapshot(deck, currentRound, slots);
    get().startTimer();
  },

  placeCard: (slotIndex: SlotIndex) => {
    const { currentCard, slots, phase, deck, currentRound } = get();
    if (phase !== "playing" || !currentCard) return;
    if (slots[slotIndex].card !== null) return;

    const newSlots = slots.map((slot) =>
      slot.index === slotIndex ? { ...slot, card: currentCard } : slot
    );

    get().stopTimer();
    set({ slots: newSlots, currentCard: null, phase: "round_end" });
    persistBoardSnapshot(deck, currentRound, newSlots);
    playSound("place");
    hapticLight();
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
    const freshSlots = get().slots;

    set({
      phase: "playing",
      currentRound: nextRound,
      currentCard: nextCard,
      timer: TIMER_SECONDS,
    });

    persistBoardSnapshot(deck, nextRound, freshSlots);
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
    const code = getActiveRoomCode();
    if (code) clearBoardSnapshot(code);
    set({ phase: "game_over", currentCard: null });
  },

  resetGame: () => {
    get().stopTimer();
    const code = getActiveRoomCode();
    if (code) clearBoardSnapshot(code);
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
