import type { Card } from "./card";

export type PlayerStatus = "waiting" | "ready";

// Trimmed combination sent over the wire for board highlighting / breakdown.
export type ResultCombo = {
  type: string;
  name: string;
  score: number;
  slotIndices: number[];
};

export type PlayerResult = {
  playerId?: string;
  nickname: string;
  score: number;
  rank: number;
  isMe: boolean;
  combinationNames: string[];
  // Each player's final board + scored combos, so any board can be reviewed.
  slots?: (Card | null)[];
  combinations?: ResultCombo[];
  // 판돈 정산 결과 (무료 방이면 0).
  prize?: number; // 획득 상금
  coinDelta?: number; // 이번 판 코인 변동 (prize - bet)
};

export type Player = {
  id: string;
  nickname: string;
  status: PlayerStatus;
  isHost: boolean;
  score?: number;
};

export type RoomStatus = "waiting" | "playing" | "finished";

export type Room = {
  id: string;
  code: string;
  players: Player[];
  status: RoomStatus;
  maxPlayers: number;
  hostId: string;
};

export const MAX_PLAYERS = 10;
export const ROOM_CODE_LENGTH = 6;
