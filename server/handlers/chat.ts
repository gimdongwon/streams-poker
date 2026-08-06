import type { Server as SocketIOServer, Socket } from "socket.io";
import { rooms } from "../state";
import { EMOTE_IDS } from "../types";

// 퀵챗(이모트) 최소 전송 간격 — 스팸/도배 방지.
const EMOTE_COOLDOWN_MS = 1500;

export const registerChatHandlers = (io: SocketIOServer, socket: Socket) => {
  // -- Chat: 퀵챗 이모트 브로드캐스트 --
  // 자유 텍스트는 받지 않는다. 사전 정의된 emoteId 만 검증 후 방 전체에 중계.
  socket.on("chat:emote", ({ code, emoteId }: { code: string; emoteId: string }) => {
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    if (!(EMOTE_IDS as readonly string[]).includes(emoteId)) return;

    const now = Date.now();
    if (player.lastEmoteAt && now - player.lastEmoteAt < EMOTE_COOLDOWN_MS) return;
    player.lastEmoteAt = now;

    io.to(code).emit("chat:emote", {
      playerId: player.id,
      nickname: player.nickname,
      emoteId,
    });
  });
};
