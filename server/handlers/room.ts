import type { Server as SocketIOServer, Socket } from "socket.io";
import type { Player, Room } from "../types";
import { normalizeBet } from "../types";
import { getCoins } from "../coins";
import {
  rooms,
  ROOM_CLEANUP_GRACE_MS,
  RECONNECT_GRACE_MS,
  removalTimers,
  reconnectKey,
} from "../state";
import { generateRoomCode } from "../deck";
import { getPublicPlayers } from "../utils";
import { checkRoundCompletion } from "../rounds";

// 방 상태 브로드캐스트 공통 페이로드 (판돈/팟 포함).
const roomState = (room: Room) => ({
  code: room.code,
  players: getPublicPlayers(room.players),
  status: room.status,
  bet: room.bet,
  pot: room.pot,
});

// 실제 좌석 제거 + 빈 방 정리 + 라운드 완료 체크 (기존 handleLeave 본문).
// socketId 기준으로 제거하며, 호출 시점 기준으로 안전하게 동작한다.
const removePlayerNow = (io: SocketIOServer, code: string, socketId: string) => {
  const room = rooms.get(code);
  if (!room) return;

  const leavingPlayer = room.players.find((p) => p.socketId === socketId);
  if (!leavingPlayer) return;

  room.players = room.players.filter((p) => p.socketId !== socketId);
  room.roundPlacements.delete(socketId);

  if (room.players.length === 0) {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }
    setTimeout(() => {
      const r = rooms.get(code);
      if (r && r.players.length === 0) {
        rooms.delete(code);
        console.log(`[Room] Deleted empty room after grace period: ${code}`);
      }
    }, ROOM_CLEANUP_GRACE_MS);
    console.log(`[Room] Room ${code} empty, scheduled cleanup in ${ROOM_CLEANUP_GRACE_MS}ms`);
    return;
  }

  if (leavingPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
  }

  io.to(code).emit("room:updated", {
    code,
    players: getPublicPlayers(room.players),
    status: room.status,
  });

  if (room.status === "playing") {
    checkRoundCompletion(io, room, code);
  }

  console.log(`[Room] Player removed from ${code}, ${room.players.length} remaining`);
};

export const handleLeave = (io: SocketIOServer, socket: Socket, code: string) => {
  const room = rooms.get(code);
  if (!room) return;

  const leavingPlayer = room.players.find((p) => p.socketId === socket.id);
  if (!leavingPlayer) return;

  socket.leave(code);

  // 게임 진행 중에는 즉시 제거하지 않고 유예 기간 동안 좌석을 유지한다.
  // 좌석 수가 유지되므로 라운드 동기화는 흐트러지지 않는다.
  if (room.status === "playing" && leavingPlayer.userId) {
    leavingPlayer.disconnected = true;

    const key = reconnectKey(code, leavingPlayer.userId);
    const existing = removalTimers.get(key);
    if (existing) clearTimeout(existing);

    const capturedSocketId = leavingPlayer.socketId;
    const timer = setTimeout(() => {
      removalTimers.delete(key);
      const r = rooms.get(code);
      if (!r) return;
      // 유예 후에도 같은 소켓에 묶여 있고 여전히 disconnected이면 진짜 제거.
      const p = r.players.find((pl) => pl.userId === leavingPlayer.userId);
      if (p && p.disconnected && p.socketId === capturedSocketId) {
        console.log(`[Room] Reconnect grace expired for ${leavingPlayer.userId} in ${code}`);
        removePlayerNow(io, code, capturedSocketId);
      }
    }, RECONNECT_GRACE_MS);

    removalTimers.set(key, timer);
    console.log(`[Room] Player disconnected in ${code}, holding seat for ${RECONNECT_GRACE_MS}ms`);
    return;
  }

  // 대기/종료 상태는 기존처럼 즉시 제거.
  removePlayerNow(io, code, socket.id);
};

// 알려진 userId 로 재접속 시: 어떤 방이든 그 userId 의 좌석을 찾아 새 소켓에 재바인딩한다.
// 좌석을 찾아 resync 를 보냈으면 true, 없으면 false.
export const rebindPlayerByUserId = (
  io: SocketIOServer,
  socket: Socket,
  userId: string,
  preferredCode?: string
): boolean => {
  // 우선 지정된 방 코드를 확인하고, 없으면 전체 방을 탐색한다.
  const candidates: [string, Room][] = preferredCode
    ? rooms.has(preferredCode)
      ? [[preferredCode, rooms.get(preferredCode)!]]
      : []
    : [];
  if (candidates.length === 0) {
    for (const [code, room] of rooms.entries()) candidates.push([code, room]);
  }

  for (const [code, room] of candidates) {
    const player = room.players.find((p) => p.userId === userId);
    if (!player) continue;

    // 제거 예약 타이머 취소
    const key = reconnectKey(code, userId);
    const timer = removalTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      removalTimers.delete(key);
    }

    // 라운드 배치 상태를 새 socketId 로 옮긴다 (이미 배치했다면 유지).
    if (room.roundPlacements.has(player.socketId)) {
      room.roundPlacements.delete(player.socketId);
      room.roundPlacements.add(socket.id);
    }

    player.socketId = socket.id;
    player.id = socket.id;
    player.disconnected = false;
    socket.join(code);

    socket.emit("game:resync", {
      code,
      status: room.status,
      deck: room.deck,
      currentRound: room.currentRound,
      players: getPublicPlayers(room.players),
    });

    // 다른 클라이언트도 disconnected 플래그 해제를 반영하도록 갱신.
    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });

    console.log(`[Room] Rebound userId ${userId} to socket ${socket.id} in ${code}`);
    return true;
  }

  return false;
};

export const registerRoomHandlers = (io: SocketIOServer, socket: Socket) => {
  // -- Room: Create --
  socket.on("room:create", ({ nickname, bet }: { nickname: string; bet?: number }) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname,
      status: "waiting",
      isHost: true,
      userId: (socket as Socket & { userId?: string }).userId,
    };

    const room: Room = {
      code,
      players: [player],
      status: "waiting",
      deck: [],
      results: [],
      currentRound: 0,
      roundPlacements: new Set(),
      roundTimer: null,
      bet: normalizeBet(bet),
      pot: 0,
    };

    rooms.set(code, room);
    socket.join(code);

    socket.emit("room:created", roomState(room));

    console.log(`[Room] Created: ${code} by ${nickname} (bet ${room.bet})`);
  });

  // -- Room: List (public waiting rooms) --
  socket.on("room:list", () => {
    const list = [...rooms.values()]
      .filter((r) => r.status === "waiting" && r.players.length > 0)
      .map((r) => ({
        code: r.code,
        hostNickname: (r.players.find((p) => p.isHost) ?? r.players[0]).nickname,
        playerCount: r.players.length,
        maxPlayers: 10,
        bet: r.bet,
      }));
    socket.emit("room:listed", { rooms: list });
  });

  // -- Room: Join --
  socket.on("room:join", async ({ code, nickname }: { code: string; nickname: string }) => {
    const room = rooms.get(code);

    if (!room) {
      socket.emit("room:error", { message: "존재하지 않는 방입니다" });
      return;
    }
    if (room.status !== "waiting") {
      socket.emit("room:error", { message: "이미 게임이 시작된 방입니다" });
      return;
    }

    const existing = room.players.find((p) => p.socketId === socket.id);
    if (existing) {
      socket.join(code);
      socket.emit("room:updated", roomState(room));
      return;
    }

    const uid = (socket as Socket & { userId?: string }).userId;

    // 같은 유저가 이미 방에 있으면(재접속/재-join 경쟁) 새 좌석을 추가하지 않고
    // 기존 좌석을 이 소켓에 재바인딩한다 → 같은 socketId 중복 seat 방지(React key 중복 해결).
    if (uid) {
      const mine = room.players.find((p) => p.userId === uid);
      if (mine) {
        if (room.roundPlacements.has(mine.socketId)) {
          room.roundPlacements.delete(mine.socketId);
          room.roundPlacements.add(socket.id);
        }
        mine.socketId = socket.id;
        mine.id = socket.id;
        mine.disconnected = false;
        const rk = reconnectKey(code, uid);
        const timer = removalTimers.get(rk);
        if (timer) {
          clearTimeout(timer);
          removalTimers.delete(rk);
        }
        socket.join(code);
        io.to(code).emit("room:updated", roomState(room));
        return;
      }
    }

    if (room.players.length >= 10) {
      socket.emit("room:error", { message: "방이 가득 찼습니다" });
      return;
    }

    // 판돈 방: 입장 전 잔액 확인 (게임 시작 시 실제 차감).
    if (room.bet > 0) {
      if (!uid) {
        socket.emit("room:error", { message: "로그인이 필요합니다" });
        return;
      }
      const coins = await getCoins(uid);
      if (coins < room.bet) {
        socket.emit("room:error", {
          message: `코인이 부족합니다 (참가비 ${room.bet.toLocaleString()})`,
        });
        return;
      }
    }

    // await(잔액 조회) 사이에 같은 소켓의 다른 join 이 먼저 좌석을 잡았을 수 있다.
    // 중복 추가(같은 socketId 2개) 방지를 위해 push 직전에 재확인한다.
    if (room.players.some((p) => p.socketId === socket.id)) {
      socket.join(code);
      socket.emit("room:updated", roomState(room));
      return;
    }

    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname,
      status: "waiting",
      isHost: false,
      userId: uid,
    };

    room.players.push(player);
    socket.join(code);

    io.to(code).emit("room:updated", roomState(room));

    console.log(`[Room] ${nickname} joined ${code}`);
  });

  // -- Room: Ready --
  socket.on("room:ready", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    player.status = player.status === "waiting" ? "ready" : "waiting";

    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });
  });

  // -- Room: Leave --
  socket.on("room:leave", ({ code }: { code: string }) => {
    handleLeave(io, socket, code);
  });

  // -- Room: Rejoin (재접속 후 좌석 재바인딩 + 현재 게임 상태 재동기화) --
  socket.on("room:rejoin", ({ code }: { code: string }) => {
    const userId = (socket as Socket & { userId?: string }).userId;
    if (!userId) return;
    const ok = rebindPlayerByUserId(io, socket, userId, code);
    if (!ok) {
      console.log(`[Room] Rejoin failed: no seat for userId ${userId} (code ${code})`);
    }
  });

  // -- Room: Play Again --
  socket.on("room:playAgain", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;

    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.status = "waiting";
    room.deck = [];
    room.results = [];
    room.currentRound = 0;
    room.roundPlacements = new Set();
    room.players.forEach((p) => {
      p.status = "waiting";
    });

    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });

    console.log(`[Room] Play again in ${code}`);
  });
};
