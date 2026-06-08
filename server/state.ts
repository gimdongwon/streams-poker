import type { Room } from "./types";

// roomCode -> Room
export const rooms = new Map<string, Room>();

// userId -> socketId (중복 로그인 감지용)
export const userSockets = new Map<string, string>();

export const ROOM_CLEANUP_GRACE_MS = 5000;
export const ROUND_SAFETY_TIMEOUT = 15000;
