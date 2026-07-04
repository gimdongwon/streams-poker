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
};

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
  // 판돈(코인). 0 = 무료 방. 게임 시작 시 전원 차감, 종료 시 1등에게 몰아줌.
  bet: number;
  pot: number;
};

// 허용 판돈 (0 = 무료)
export const ALLOWED_BETS = [0, 100, 500, 1000, 5000, 10000] as const;

export const normalizeBet = (bet: unknown): number =>
  typeof bet === "number" && (ALLOWED_BETS as readonly number[]).includes(bet)
    ? bet
    : 0;
