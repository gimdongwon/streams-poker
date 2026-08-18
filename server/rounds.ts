import type { Server as SocketIOServer } from "socket.io";
import type { Room } from "./types";
import { ROUND_SAFETY_TIMEOUT } from "./state";
import { scheduleBotTurns, submitBotResults } from "./bots";

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
    // 봇들의 이번 라운드 배치 예약
    scheduleBotTurns(io, room, code);
  } else {
    // 10라운드 종료 — 봇들의 최종 보드 제출 (사람은 클라이언트가 제출)
    submitBotResults(io, room, code).catch((e) =>
      console.error("[Bot] 결과 제출 실패:", e)
    );
  }
};

export const checkRoundCompletion = (io: SocketIOServer, room: Room, code: string) => {
  if (room.roundPlacements.size >= room.players.length) {
    setTimeout(() => advanceRound(io, room, code), 800);
  }
};
