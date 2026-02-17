export type PlayerStatus = "waiting" | "ready";

export type PlayerResult = {
  nickname: string;
  score: number;
  rank: number;
  isMe: boolean;
  combinationNames: string[];
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
