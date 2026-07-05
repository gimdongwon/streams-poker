import type { Server as SocketIOServer } from "socket.io";
import type { Room } from "./types";
import { ROUND_SAFETY_TIMEOUT } from "./state";

export const startRoundTimer = (io: SocketIOServer, room: Room, code: string) => {
  if (room.roundTimer) clearTimeout(room.roundTimer);

  // 서버 기준 라운드 마감 시각 기록 (재접속 시 남은 시간 계산).
  room.roundEndsAt = Date.now() + ROUND_SAFETY_TIMEOUT;

  room.roundTimer = setTimeout(() => {
    if (room.status !== "playing") return;

    console.log(`[Round] Safety timeout for round ${room.currentRound} in ${code}`);
    advanceRound(io, room, code);
  }, ROUND_SAFETY_TIMEOUT);
};

export const advanceRound = (io: SocketIOServer, room: Room, code: string) => {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  room.currentRound += 1;
  room.roundPlacements = new Set();

  io.to(code).emit("game:nextRound", { round: room.currentRound });

  console.log(`[Round] Advanced to round ${room.currentRound} in ${code}`);

  if (room.currentRound <= 10) {
    startRoundTimer(io, room, code);
  }
};

export const checkRoundCompletion = (io: SocketIOServer, room: Room, code: string) => {
  if (room.roundPlacements.size >= room.players.length) {
    setTimeout(() => advanceRound(io, room, code), 800);
  }
};
