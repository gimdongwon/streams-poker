import { create } from "zustand";
import type { Player, PlayerResult, RoomStatus } from "@/types/room";
import { MAX_PLAYERS, ROOM_CODE_LENGTH } from "@/types/room";

type RoomStore = {
  roomId: string | null;
  roomCode: string | null;
  players: Player[];
  status: RoomStatus;
  currentPlayerId: string | null;
  nickname: string;
  playerResults: PlayerResult[];

  setNickname: (nickname: string) => void;
  createRoom: () => string;
  joinRoom: (roomCode: string) => boolean;
  toggleReady: () => void;
  startGame: () => boolean;
  leaveRoom: () => void;
  resetRoom: () => void;
  generateResults: (myScore: number, myCombinationNames: string[]) => void;
};

const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  roomCode: null,
  players: [],
  status: "waiting",
  currentPlayerId: null,
  nickname: "",
  playerResults: [],

  setNickname: (nickname: string) => set({ nickname }),

  createRoom: () => {
    const playerId = generatePlayerId();
    const roomCode = generateRoomCode();
    const roomId = `room_${roomCode}`;
    const { nickname } = get();

    const host: Player = {
      id: playerId,
      nickname: nickname || "Player 1",
      status: "waiting",
      isHost: true,
    };

    set({
      roomId,
      roomCode,
      players: [host],
      status: "waiting",
      currentPlayerId: playerId,
    });

    return roomCode;
  },

  joinRoom: (roomCode: string) => {
    const { players } = get();
    if (players.length >= MAX_PLAYERS) return false;

    const playerId = generatePlayerId();
    const { nickname } = get();

    const newPlayer: Player = {
      id: playerId,
      nickname: nickname || `Player ${players.length + 1}`,
      status: "waiting",
      isHost: false,
    };

    set({
      roomId: `room_${roomCode}`,
      roomCode,
      players: [...players, newPlayer],
      currentPlayerId: playerId,
    });

    return true;
  },

  toggleReady: () => {
    const { players, currentPlayerId } = get();

    const updatedPlayers = players.map((p) => {
      if (p.id === currentPlayerId) {
        return {
          ...p,
          status: (p.status === "waiting" ? "ready" : "waiting") as
            | "waiting"
            | "ready",
        };
      }
      return p;
    });

    set({ players: updatedPlayers });
  },

  startGame: () => {
    const { players, currentPlayerId } = get();

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer?.isHost) return false;

    const allReady = players
      .filter((p) => !p.isHost)
      .every((p) => p.status === "ready");
    if (!allReady || players.length < 2) return false;

    set({ status: "playing" });
    return true;
  },

  leaveRoom: () => {
    const { players, currentPlayerId } = get();
    const remainingPlayers = players.filter((p) => p.id !== currentPlayerId);

    if (remainingPlayers.length === 0) {
      get().resetRoom();
      return;
    }

    const currentWasHost = players.find(
      (p) => p.id === currentPlayerId
    )?.isHost;
    if (currentWasHost && remainingPlayers.length > 0) {
      remainingPlayers[0].isHost = true;
    }

    set({
      players: remainingPlayers,
      currentPlayerId: null,
      roomId: null,
      roomCode: null,
    });
  },

  resetRoom: () => {
    set({
      roomId: null,
      roomCode: null,
      players: [],
      status: "waiting",
      currentPlayerId: null,
      playerResults: [],
    });
  },

  generateResults: (myScore: number, myCombinationNames: string[]) => {
    const { players, currentPlayerId, nickname } = get();

    const COMBO_POOL = [
      "원페어",
      "투페어",
      "트리플",
      "스트레이트",
      "플러시",
      "풀하우스",
      "포카드",
    ];

    const results: PlayerResult[] = players.map((p) => {
      if (p.id === currentPlayerId) {
        return {
          nickname: nickname || p.nickname,
          score: myScore,
          rank: 0,
          isMe: true,
          combinationNames: myCombinationNames,
        };
      }

      const otherScore = Math.floor(Math.random() * 50) + 2;
      const comboCount = Math.floor(Math.random() * 3) + 1;
      const otherCombos = Array.from({ length: comboCount }, () =>
        COMBO_POOL[Math.floor(Math.random() * COMBO_POOL.length)]
      );

      return {
        nickname: p.nickname,
        score: otherScore,
        rank: 0,
        isMe: false,
        combinationNames: otherCombos,
      };
    });

    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    set({ playerResults: results, status: "finished" });
  },
}));
