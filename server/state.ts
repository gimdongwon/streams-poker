import type { Room } from "./types";

// roomCode -> Room
export const rooms = new Map<string, Room>();

// userId -> socketId (중복 로그인 감지용)
export const userSockets = new Map<string, string>();

export const ROOM_CLEANUP_GRACE_MS = 5000;
export const ROUND_SAFETY_TIMEOUT = 15000;

// 게임 진행 중 소켓이 끊겼을 때 좌석을 유지하는 유예 시간 (재접속 대기)
export const RECONNECT_GRACE_MS = 20000;

// "roomCode:userId" -> 좌석 제거 예약 타이머 (유예 중 재접속하면 취소)
export const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const reconnectKey = (code: string, userId: string) => `${code}:${userId}`;
