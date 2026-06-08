import type { Player } from "./types";

// socketId 등 내부 정보를 제외하고 클라이언트로 보낼 플레이어 목록 생성
export const getPublicPlayers = (players: Player[]) =>
  players.map(({ socketId: _socketId, ...rest }) => rest);
