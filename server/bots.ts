// 봇 플레이어: 퀵매치에서 인원을 채우는 서버 조종 플레이어.
// - 모두 같은 덱을 받는 게임 구조라, 봇은 "현재 카드를 어느 슬롯에 놓을지"만 정하면 된다.
// - 배치 휴리스틱: 각 빈 슬롯에 놓아보고 부분 보드 점수가 가장 높은 곳 선택
//   (동률/근소 차이는 랜덤 — 사람 같은 편차를 위해 상위 후보 중 추첨).
import type { Server as SocketIOServer } from "socket.io";
import type { CardData, Room } from "./types";
import type { Card } from "@/types/card";
import type { Slot, SlotIndex } from "@/types/game";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import { checkRoundCompletion } from "./rounds";
import { recordResult } from "./gameflow";

const BOT_NAMES = [
  "달빛여우", "카드마스터K", "네온샤크", "은하수", "포커페이스",
  "블러핑곰", "새벽두시", "체리조커", "미드나잇", "플러쉬왕",
];

let botSeq = 0;

// 봇별 실력 편차 (차선책 선택 확률) — botId 해시 기반 0.1~0.35
const botBlunderRate = (botId: string): number => {
  let h = 0;
  for (const ch of botId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 0.1 + (h % 26) / 100;
};

export const createBotPlayer = (takenNames: string[] = []) => {
  const id = `bot_${Date.now().toString(36)}_${botSeq++}`;
  // 방 안에서 이름 중복 방지
  const available = BOT_NAMES.filter((n) => !takenNames.includes(n));
  const pool = available.length > 0 ? available : BOT_NAMES;
  const name = pool[Math.floor(Math.random() * pool.length)];
  return {
    id,
    socketId: id, // 소켓 없음 — 내부 식별용으로 동일 값 사용
    nickname: name,
    status: "ready" as const,
    isHost: false,
    isBot: true,
  };
};

const toCard = (c: CardData): Card => c as unknown as Card;

const toSlots = (board: (CardData | null)[]): Slot[] =>
  board.map((card, i) => ({
    index: i as SlotIndex,
    card: card ? toCard(card) : null,
  }));

// 현재 카드를 놓을 슬롯 선택: 배치 시 부분 보드 점수 최대화 + 봇별 실수 확률.
// (봇마다 blunder 확률이 달라 같은 덱이어도 서로 다른 보드/점수가 나온다)
export const pickBotSlot = (
  board: (CardData | null)[],
  card: CardData,
  botId = ""
): number => {
  const empty: number[] = [];
  board.forEach((c, i) => {
    if (c === null) empty.push(i);
  });
  if (empty.length === 0) return -1;
  if (empty.length === 1) return empty[0];

  const scored = empty.map((idx) => {
    const trial = [...board];
    trial[idx] = card;
    const score = calculateTotalScore(evaluateSlots(toSlots(trial)));
    return { idx, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // 봇별 실수: 일정 확률로 무작위 빈 슬롯 (사람 같은 편차 + 봇 간 차별화)
  if (Math.random() < botBlunderRate(botId)) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // 최고점 후보(동률 포함) 중 랜덤
  const best = scored[0].score;
  const top = scored.filter((s) => s.score === best);
  return top[Math.floor(Math.random() * top.length)].idx;
};

// 현재 라운드의 봇 배치 예약 (라운드 시작 시 호출).
export const scheduleBotTurns = (
  io: SocketIOServer,
  room: Room,
  code: string
) => {
  const bots = room.players.filter((p) => p.isBot);
  if (bots.length === 0) return;
  if (room.status !== "playing" || room.currentRound < 1 || room.currentRound > 10) return;

  const round = room.currentRound;
  const card = room.deck[round - 1];
  if (!card) return;

  if (!room.botBoards) room.botBoards = new Map();

  for (const bot of bots) {
    if (room.roundPlacements.has(bot.socketId)) continue;
    // 1.5~6초 (라운드 타이머 15초 내). env 는 테스트용 오버라이드.
    const min = parseInt(process.env.BOT_TURN_MIN_MS || "1500", 10);
    const max = parseInt(process.env.BOT_TURN_MAX_MS || "6000", 10);
    const delay = min + Math.random() * Math.max(0, max - min);

    setTimeout(() => {
      const r = room; // 참조 유지 — 방 삭제/상태 변화 가드
      if (r.status !== "playing" || r.currentRound !== round) return;
      if (!r.players.some((p) => p.id === bot.id)) return;

      const board =
        r.botBoards!.get(bot.id) ?? Array<CardData | null>(10).fill(null);
      const slot = pickBotSlot(board, card, bot.id);
      if (slot < 0) return;
      board[slot] = card;
      r.botBoards!.set(bot.id, board);

      r.roundPlacements.add(bot.socketId);
      const placedPlayers = r.players
        .filter((p) => r.roundPlacements.has(p.socketId))
        .map((p) => ({ id: p.id, nickname: p.nickname }));
      io.to(code).emit("game:playerPlaced", {
        round,
        placedPlayers,
        totalPlayers: r.players.length,
      });
      checkRoundCompletion(io, r, code);
    }, delay);
  }
};

// 10라운드 종료 후 봇들의 최종 보드 제출.
export const submitBotResults = async (
  io: SocketIOServer,
  room: Room,
  code: string
) => {
  const bots = room.players.filter((p) => p.isBot);
  for (const bot of bots) {
    const board =
      room.botBoards?.get(bot.id) ?? Array<CardData | null>(10).fill(null);
    await recordResult(io, room, code, bot, board);
  }
};
