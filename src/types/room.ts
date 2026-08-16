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
  // 순위별 고정 보상 (시스템 지급, 잃는 코인 없음).
  reward?: number;
};

export type Player = {
  id: string;
  nickname: string;
  status: PlayerStatus;
  isHost: boolean;
  score?: number;
  // 친구 추가 등 유저 식별용 (서버 getPublicPlayers 가 포함해서 보냄)
  userId?: string;
  // 소켓 끊김(잠금/백그라운드) 후 재접속 유예 중
  disconnected?: boolean;
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

export const MAX_PLAYERS = 15;
export const ROOM_CODE_LENGTH = 6;
