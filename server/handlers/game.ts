import type { Server as SocketIOServer, Socket } from "socket.io";
import type { CardData, ResultCombo } from "../types";
import { rooms } from "../state";
import { createGameDeck } from "../deck";
import { startRoundTimer, checkRoundCompletion } from "../rounds";

export const registerGameHandlers = (io: SocketIOServer, socket: Socket) => {
  // -- Game: Start --
  socket.on("game:start", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;

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

    const deck = createGameDeck();
    room.deck = deck;
    room.status = "playing";
    room.results = [];
    room.currentRound = 1;
    room.roundPlacements = new Set();

    io.to(code).emit("game:started", { deck });

    startRoundTimer(io, room, code);

    console.log(`[Game] Started in ${code} with ${room.players.length} players`);
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
  socket.on("game:result", ({ code, score, combinationNames, tiebreaker, slots, combinations }: {
    code: string;
    score: number;
    combinationNames: string[];
    tiebreaker: number;
    slots?: (CardData | null)[];
    combinations?: ResultCombo[];
  }) => {
    const room = rooms.get(code);
    if (!room || room.status !== "playing") return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    const alreadySubmitted = room.results.some((r) => r.playerId === player.id);
    if (alreadySubmitted) return;

    room.results.push({
      playerId: player.id,
      nickname: player.nickname,
      score,
      combinationNames,
      tiebreaker: tiebreaker ?? 0,
      slots,
      combinations,
    });

    console.log(`[Game] ${player.nickname} submitted: ${score}pts (tb:${tiebreaker}) (${room.results.length}/${room.players.length})`);

    if (room.results.length === room.players.length) {
      room.results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.tiebreaker - a.tiebreaker;
      });
      const rankedResults = room.results.map((r, i) => ({ ...r, rank: i + 1 }));

      room.status = "finished";

      io.to(code).emit("game:results", { results: rankedResults });

      console.log(`[Game] All results in for ${code}`);
    }
  });
};
