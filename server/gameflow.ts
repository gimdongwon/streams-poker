// 게임 시작/결과 기록 공통 로직.
// - 소켓 핸들러(game.ts)와 퀵매치 자동 시작(room.ts), 봇 제출(bots.ts)이 공유한다.
import type { Server as SocketIOServer } from "socket.io";
import type { CardData, Player, Room } from "./types";
import { rewardForRank, coinEventMultiplier } from "./types";
import { createGameDeck } from "./deck";
import { startRoundTimer } from "./rounds";
import { scoreBoard } from "./scoring";
import { addCoins } from "./coins";
import { scheduleBotTurns } from "./bots";

// 게임 시작 (덱 생성 + 브로드캐스트 + 라운드 타이머 + 봇 배치 예약).
export const startGameForRoom = (
  io: SocketIOServer,
  room: Room,
  code: string
) => {
  const deck = createGameDeck();
  room.deck = deck;
  room.status = "playing";
  room.results = [];
  room.currentRound = 1;
  room.roundPlacements = new Set();
  room.botBoards = new Map();

  io.to(code).emit("game:started", { deck });

  startRoundTimer(io, room, code);
  scheduleBotTurns(io, room, code);

  console.log(`[Game] Started in ${code} with ${room.players.length} players`);
};

// 한 플레이어(사람/봇)의 최종 보드 기록. 전원 제출 시 순위 확정 + 보상 정산.
export const recordResult = async (
  io: SocketIOServer,
  room: Room,
  code: string,
  player: Player,
  slots: (CardData | null)[] | undefined
) => {
  if (room.status !== "playing") return;

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

  console.log(
    `[Game] ${player.nickname} scored (server): ${score}pts (tb:${tiebreaker}) (${room.results.length}/${room.players.length})`
  );

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
        prev != null && prev.score === r.score && prev.tiebreaker === r.tiebreaker;
      const rank = tied ? lastRank : i + 1;
      lastRank = rank;
      return { ...r, rank };
    });

    room.status = "finished";

    // 순위별 고정 보상 지급 (봇은 userId 없음 → 자동 제외). 이벤트 기간엔 배수 적용.
    const multiplier = coinEventMultiplier();
    const settledResults = [] as (typeof rankedResults[number] & {
      reward: number;
    })[];
    for (const r of rankedResults) {
      const reward = rewardForRank(r.rank) * multiplier;
      const p = room.players.find((pl) => pl.id === r.playerId);
      if (p?.userId && reward > 0) await addCoins(p.userId, reward);
      settledResults.push({ ...r, reward });
    }

    io.to(code).emit("game:results", { results: settledResults });

    console.log(`[Game] All results in for ${code} (rewards granted)`);
  }
};
