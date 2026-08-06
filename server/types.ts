export type Player = {
  id: string;
  socketId: string;
  nickname: string;
  status: "waiting" | "ready";
  isHost: boolean;
  // Stable identity used to re-bind a player to a new socket on reconnect.
  userId?: string;
  // True while the player's socket is gone but inside the reconnect grace window.
  disconnected?: boolean;
  // 퀵챗(이모트) 스팸 방지용 마지막 전송 시각(ms).
  lastEmoteAt?: number;
};

// 퀵챗 이모트 ID 목록 — 클라이언트(src/lib/emotes.ts)와 반드시 일치해야 한다.
// 자유 입력이 아닌 사전 정의 문구만 허용 (UGC 아님 → 신고/필터링 의무 없음).
export const EMOTE_IDS = [
  "hello",
  "nice",
  "wow",
  "cheer",
  "close",
  "hurry",
  "gg",
  "fire",
] as const;

export type CardData = {
  type: "normal" | "joker";
  suit?: string;
  rank?: string;
  jokerIndex?: number;
  id: string;
};

export type ResultCombo = {
  type: string;
  name: string;
  score: number;
  slotIndices: number[];
};

export type GameResult = {
  playerId: string;
  nickname: string;
  score: number;
  combinationNames: string[];
  tiebreaker: number;
  // Final board + scored combos so any player's board can be reviewed.
  slots?: (CardData | null)[];
  combinations?: ResultCombo[];
};

export type Room = {
  code: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
  deck: CardData[];
  results: GameResult[];
  currentRound: number;
  roundPlacements: Set<string>;
  roundTimer: ReturnType<typeof setTimeout> | null;
  // 현재 라운드가 서버 기준으로 끝나는 시각(ms epoch). 재접속 시 남은 시간 계산용.
  roundEndsAt: number;
};

// 멀티플레이 순위별 고정 보상 (시스템 지급 — 참가비/베팅 없음).
// 유저는 코인을 잃지 않는다. 1등 100, 2등 50, 그 외 참가 보상 10.
export const RANK_REWARDS: Record<number, number> = { 1: 100, 2: 50 };
export const PARTICIPATION_REWARD = 10;

export const rewardForRank = (rank: number): number =>
  RANK_REWARDS[rank] ?? PARTICIPATION_REWARD;
