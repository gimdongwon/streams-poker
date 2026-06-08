export type Player = {
  id: string;
  socketId: string;
  nickname: string;
  status: "waiting" | "ready";
  isHost: boolean;
};

export type CardData = {
  type: "normal" | "joker";
  suit?: string;
  rank?: string;
  jokerIndex?: number;
  id: string;
};

export type GameResult = {
  playerId: string;
  nickname: string;
  score: number;
  combinationNames: string[];
  tiebreaker: number;
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
};
