import type { Server as SocketIOServer, Socket } from "socket.io";
import type { CardData } from "../types";
import { rooms } from "../state";
import { createGameDeck } from "../deck";
import { startRoundTimer, checkRoundCompletion } from "../rounds";
import { scoreBoard } from "../scoring";
import { deductCoins, addCoins } from "../coins";

export const registerGameHandlers = (io: SocketIOServer, socket: Socket) => {
  // -- Game: Start --
  socket.on("game:start", async ({ code }: { code: string }) => {
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

    // 판돈 방: 전원에게서 판돈을 차감(원자적). 한 명이라도 실패하면 전원 환불 후 중단.
    if (room.bet > 0) {
      const deducted: string[] = [];
      let failed = false;
      for (const p of room.players) {
        if (!p.userId) {
          failed = true;
          break;
        }
        const bal = await deductCoins(p.userId, room.bet);
        if (bal === -1) {
          failed = true;
          break;
        }
        deducted.push(p.userId);
      }
      if (failed) {
        for (const uid of deducted) await addCoins(uid, room.bet);
        socket.emit("room:error", {
          message: "판돈 차감에 실패했습니다 (코인이 부족한 플레이어가 있어요)",
        });
        return;
      }
      room.pot = room.bet * room.players.length;
    } else {
      room.pot = 0;
    }

    const deck = createGameDeck();
    room.deck = deck;
    room.status = "playing";
    room.results = [];
    room.currentRound = 1;
    room.roundPlacements = new Set();

    io.to(code).emit("game:started", { deck, bet: room.bet, pot: room.pot });

    startRoundTimer(io, room, code);

    console.log(`[Game] Started in ${code} with ${room.players.length} players (bet ${room.bet}, pot ${room.pot})`);
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

    const alreadySubmitted = room.results.some((r) => r.playerId === player.id);
    if (alreadySubmitted) return;

    // 서버 권위 재계산
    const { score, tiebreaker, combinationNames, combinations } = scoreBoard(slots);

    room.results.push({
      playerId: player.id,
      nickname: player.nickname,
      score,
      combinationNames,
      tiebreaker,
      slots,
      combinations,
    });

    console.log(`[Game] ${player.nickname} scored (server): ${score}pts (tb:${tiebreaker}) (${room.results.length}/${room.players.length})`);

    if (room.results.length === room.players.length) {
      room.results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.tiebreaker - a.tiebreaker;
      });
      // 표준 경쟁 순위(1,1,3): 점수+타이브레이커가 완전히 같으면 공동 순위.
      let lastRank = 0;
      const rankedResults = room.results.map((r, i) => {
        const prev = i > 0 ? room.results[i - 1] : null;
        const tied =
          prev != null &&
          prev.score === r.score &&
          prev.tiebreaker === r.tiebreaker;
        const rank = tied ? lastRank : i + 1;
        lastRank = rank;
        return { ...r, rank };
      });

      room.status = "finished";

      // 판돈 정산: 팟을 1등에게 몰아줌. 공동 1등이면 균등 분배(나머지는 앞 승자부터 1씩).
      const prizeByPlayerId = new Map<string, number>();
      if (room.pot > 0) {
        const winners = rankedResults.filter((r) => r.rank === 1);
        if (winners.length > 0) {
          const share = Math.floor(room.pot / winners.length);
          let remainder = room.pot - share * winners.length;
          for (const w of winners) {
            let prize = share;
            if (remainder > 0) {
              prize += 1;
              remainder -= 1;
            }
            prizeByPlayerId.set(w.playerId, prize);
            const p = room.players.find((pl) => pl.id === w.playerId);
            if (p?.userId && prize > 0) await addCoins(p.userId, prize);
          }
        }
      }

      // 각 결과에 이번 판 코인 변동(prize - bet)을 붙여 전달.
      const settledResults = rankedResults.map((r) => ({
        ...r,
        prize: prizeByPlayerId.get(r.playerId) ?? 0,
        coinDelta: (prizeByPlayerId.get(r.playerId) ?? 0) - room.bet,
      }));

      io.to(code).emit("game:results", {
        results: settledResults,
        bet: room.bet,
        pot: room.pot,
      });

      // 팟 소진.
      room.pot = 0;

      console.log(`[Game] All results in for ${code} (pot settled)`);
    }
  });
};
