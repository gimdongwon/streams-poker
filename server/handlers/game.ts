import type { Server as SocketIOServer, Socket } from "socket.io";
import type { CardData } from "../types";
import { rooms } from "../state";
import { checkRoundCompletion } from "../rounds";
import { startGameForRoom, recordResult } from "../gameflow";

export const registerGameHandlers = (io: SocketIOServer, socket: Socket) => {
  // -- Game: Start --
  socket.on("game:start", async ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    if (room.status === "playing") return; // 이미 시작됨 (자동 시작과의 레이스 방지)

    const host = room.players.find((p) => p.socketId === socket.id);
    if (!host?.isHost) {
      socket.emit("room:error", { message: "방장만 게임을 시작할 수 있습니다" });
      return;
    }

    const nonHostPlayers = room.players.filter((p) => !p.isHost);
    const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.status === "ready");

    if (!allReady || room.players.length < 2) {
      socket.emit("room:error", { message: "모든 플레이어가 준비되어야 합니다 (2명 이상)" });
      return;
    }

    startGameForRoom(io, room, code);
  });

  // -- Game: Round Placed --
  socket.on("game:placed", ({ code, round }: { code: string; round: number }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    if (room.currentRound !== round) return;

    room.roundPlacements.add(socket.id);

    const placedPlayers = room.players
      .filter((p) => room.roundPlacements.has(p.socketId))
      .map((p) => ({ id: p.id, nickname: p.nickname }));

    io.to(code).emit("game:playerPlaced", {
      round,
      placedPlayers,
      totalPlayers: room.players.length,
    });

    console.log(`[Round] ${player.nickname} placed (${placedPlayers.length}/${room.players.length}) round ${round} in ${code}`);

    checkRoundCompletion(io, room, code);
  });

  // -- Game: Submit Result --
  // 클라이언트가 보낸 점수/조합은 신뢰하지 않는다. 보드(slots)만으로 서버가 재계산해
  // 방 순위의 권위값으로 삼는다. (글로벌 리더보드는 /api/leaderboard 에서 별도 재계산)
  socket.on("game:result", async ({ code, slots }: {
    code: string;
    slots?: (CardData | null)[];
  }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    await recordResult(io, room, code, player, slots);
  });
};
