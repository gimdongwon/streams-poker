import { create } from "zustand";
import type { Player, PlayerResult, RoomStatus } from "@/types/room";
import type { Card } from "@/types/card";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useGameStore } from "@/stores/gameStore";

type RoundPlacedPlayer = {
  id: string;
  nickname: string;
};

type RoomStore = {
  roomCode: string | null;
  players: Player[];
  status: RoomStatus;
  nickname: string;
  playerResults: PlayerResult[];
  multiDeck: Card[] | null;
  error: string | null;
  isConnected: boolean;
  roundPlacedPlayers: RoundPlacedPlayer[];

  setNickname: (nickname: string) => void;

  // Socket-based actions
  createRoom: (nickname: string) => void;
  joinRoom: (code: string, nickname: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  submitResult: (score: number, combinationNames: string[], tiebreaker: number) => void;
  emitPlaced: (round: number) => void;
  leaveRoom: () => void;
  playAgain: () => void;
  resetRoom: () => void;
  clearError: () => void;

  // Local-only (single)
  createLocalRoom: () => string;
  joinLocalRoom: (code: string) => boolean;
  generateResults: (myScore: number, myCombinationNames: string[]) => void;

  // Socket listeners
  initSocketListeners: () => void;
  cleanupSocketListeners: () => void;
};

const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomCode: null,
  players: [],
  status: "waiting",
  nickname: "",
  playerResults: [],
  multiDeck: null,
  error: null,
  isConnected: false,
  roundPlacedPlayers: [],

  setNickname: (nickname: string) => set({ nickname }),

  clearError: () => set({ error: null }),

  // --- Socket-based multiplayer ---

  createRoom: (nickname: string) => {
    const socket = connectSocket();
    socket.emit("room:create", { nickname });
  },

  joinRoom: (code: string, nickname: string) => {
    const socket = connectSocket();
    socket.emit("room:join", { code, nickname });
  },

  toggleReady: () => {
    const { roomCode } = get();
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("room:ready", { code: roomCode });
  },

  startGame: () => {
    const { roomCode } = get();
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("game:start", { code: roomCode });
  },

  submitResult: (score: number, combinationNames: string[], tiebreaker: number) => {
    const { roomCode } = get();
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("game:result", { code: roomCode, score, combinationNames, tiebreaker });
  },

  emitPlaced: (round: number) => {
    const { roomCode } = get();
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("game:placed", { code: roomCode, round });
  },

  leaveRoom: () => {
    const { roomCode } = get();
    if (roomCode) {
      const socket = getSocket();
      socket.emit("room:leave", { code: roomCode });
    }
    disconnectSocket();
    set({
      roomCode: null,
      players: [],
      status: "waiting",
      playerResults: [],
      multiDeck: null,
      isConnected: false,
      roundPlacedPlayers: [],
    });
  },

  playAgain: () => {
    const { roomCode } = get();
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("room:playAgain", { code: roomCode });
  },

  resetRoom: () => {
    const { roomCode } = get();
    if (roomCode) {
      try {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit("room:leave", { code: roomCode });
        }
      } catch {
        // socket not initialized
      }
    }
    disconnectSocket();
    set({
      roomCode: null,
      players: [],
      status: "waiting",
      playerResults: [],
      multiDeck: null,
      error: null,
      isConnected: false,
      roundPlacedPlayers: [],
    });
  },

  initSocketListeners: () => {
    const socket = getSocket();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("auth:forceLogout");
    socket.off("room:created");
    socket.off("room:updated");
    socket.off("room:error");
    socket.off("game:started");
    socket.off("game:playerPlaced");
    socket.off("game:nextRound");
    socket.off("game:results");

    socket.on("connect", () => {
      set({ isConnected: true });

      const authUser = useAuthStore.getState().user;
      if (authUser?.id) {
        socket.emit("auth:register", { userId: authUser.id });
      }
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("auth:forceLogout", () => {
      disconnectSocket();
      set({
        roomCode: null,
        players: [],
        status: "waiting",
        playerResults: [],
        multiDeck: null,
        isConnected: false,
        roundPlacedPlayers: [],
      });

      if (typeof window !== "undefined") {
        window.alert("다른 곳에서 로그인되어 현재 세션이 종료됩니다.");
      }

      const authStore = useAuthStore.getState();
      authStore.logout();
      useAuthStore.setState({ forcedOut: true });
    });

    socket.on("room:created", ({ code, players, status }) => {
      set({ roomCode: code, players, status, error: null });
    });

    socket.on("room:updated", ({ code, players, status }) => {
      if (status === "waiting") {
        set({ roomCode: code, players, status, error: null, multiDeck: null, playerResults: [], roundPlacedPlayers: [] });
      } else {
        set({ roomCode: code, players, status, error: null });
      }
    });

    socket.on("room:error", ({ message }) => {
      set({ error: message });
    });

    socket.on("game:started", ({ deck }) => {
      set({ multiDeck: deck, status: "playing", playerResults: [], roundPlacedPlayers: [] });
    });

    socket.on("game:playerPlaced", ({ placedPlayers }: { round: number; placedPlayers: RoundPlacedPlayer[]; totalPlayers: number }) => {
      set({ roundPlacedPlayers: placedPlayers });
    });

    socket.on("game:nextRound", () => {
      set({ roundPlacedPlayers: [] });
      setTimeout(() => {
        useGameStore.getState().nextRound();
      }, 300);
    });

    socket.on("game:results", ({ results }) => {
      const socket = getSocket();
      const myId = socket.id;

      const playerResults: PlayerResult[] = results.map(
        (r: { playerId: string; nickname: string; score: number; rank: number; combinationNames: string[] }) => ({
          nickname: r.nickname,
          score: r.score,
          rank: r.rank,
          isMe: r.playerId === myId,
          combinationNames: r.combinationNames,
        })
      );

      set({ playerResults, status: "finished" });
    });
  },

  cleanupSocketListeners: () => {
    const socket = getSocket();
    socket.off("connect");
    socket.off("disconnect");
    socket.off("auth:forceLogout");
    socket.off("room:created");
    socket.off("room:updated");
    socket.off("room:error");
    socket.off("game:started");
    socket.off("game:playerPlaced");
    socket.off("game:nextRound");
    socket.off("game:results");
  },

  // --- Local-only (single mode & backward compat) ---

  createLocalRoom: () => {
    const code = generateRoomCode();
    set({
      roomCode: code,
      players: [{ id: "local_host", nickname: get().nickname || "Player 1", status: "waiting", isHost: true }],
      status: "waiting",
    });
    return code;
  },

  joinLocalRoom: (code: string) => {
    const { players } = get();
    if (players.length >= 10) return false;
    set({
      roomCode: code,
      players: [...players, { id: "local_guest", nickname: get().nickname || "Player 2", status: "waiting", isHost: false }],
    });
    return true;
  },

  generateResults: (myScore: number, myCombinationNames: string[]) => {
    const { nickname } = get();

    const COMBO_POOL = ["원페어", "투페어", "트리플", "스트레이트", "플러시", "풀하우스", "포카드"];

    const results: PlayerResult[] = [
      {
        nickname: nickname || "나",
        score: myScore,
        rank: 0,
        isMe: true,
        combinationNames: myCombinationNames,
      },
    ];

    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    set({ playerResults: results, status: "finished" });
  },
}));
