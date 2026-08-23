import type { Server as SocketIOServer, Socket } from "socket.io";
import type { Player, Room } from "../types";
import { MAX_PLAYERS } from "../types";
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
import { createBotPlayer } from "../bots";
import { startGameForRoom } from "../gameflow";

// 퀵매치: 봇 채움까지 기다리는 시간 / 채움 후 자동 시작까지의 여유
// (env 는 테스트용 오버라이드 — 미설정 시 운영 기본값)
const QUICKMATCH_FILL_MS = parseInt(process.env.QUICKMATCH_FILL_MS || "8000", 10);
const QUICKMATCH_START_DELAY_MS = parseInt(process.env.QUICKMATCH_START_DELAY_MS || "1500", 10);
// 퀵매치 방 목표 인원 (사람+봇)
const QUICKMATCH_TARGET = 4;

// 방 상태 브로드캐스트 공통 페이로드.
const roomState = (room: Room) => ({
  code: room.code,
  players: getPublicPlayers(room.players),
  status: room.status,
  quickMatch: room.quickMatch ?? false,
});

// 퀵매치 자동 시작 예약: FILL_MS 후 봇으로 인원을 채우고 잠시 뒤 자동 시작.
// 방 생성 직후와 "대기방으로"(재경기) 양쪽에서 사용. 기존 예약은 교체한다.
// 시작은 반드시 이 경로(startGameForRoom의 status 가드 포함)로만 일어나
// 이중 시작 → 덱 재생성 → 사람/봇 카드 불일치를 방지한다.
const armQuickMatchAutoStart = (io: SocketIOServer, code: string) => {
  const room = rooms.get(code);
  if (!room) return;
  if (room.botFillTimer) clearTimeout(room.botFillTimer);

  room.botFillTimer = setTimeout(() => {
    const r = rooms.get(code);
    if (!r || r.status !== "waiting") return;
    r.botFillTimer = null;
    const humans = r.players.filter((p) => !p.isBot && !p.disconnected);
    if (humans.length === 0) return; // 전원 이탈 — 채우지 않음

    while (r.players.length < QUICKMATCH_TARGET) {
      r.players.push(createBotPlayer(r.players.map((p) => p.nickname)));
    }
    io.to(code).emit("room:updated", roomState(r));
    console.log(`[QuickMatch] Filled ${code} with bots → auto start`);

    setTimeout(() => {
      const r2 = rooms.get(code);
      if (!r2 || r2.status !== "waiting") return;
      if (r2.players.filter((p) => !p.isBot && !p.disconnected).length === 0) return;
      startGameForRoom(io, r2, code);
    }, QUICKMATCH_START_DELAY_MS);
  }, QUICKMATCH_FILL_MS);
};

// 실제 좌석 제거 + 빈 방 정리 + 라운드 완료 체크 (기존 handleLeave 본문).
// socketId 기준으로 제거하며, 호출 시점 기준으로 안전하게 동작한다.
const removePlayerNow = (io: SocketIOServer, code: string, socketId: string) => {
  const room = rooms.get(code);
  if (!room) return;

  const leavingPlayer = room.players.find((p) => p.socketId === socketId);
  if (!leavingPlayer) return;

  room.players = room.players.filter((p) => p.socketId !== socketId);
  room.roundPlacements.delete(socketId);

  // 사람이 모두 떠나고 봇만 남으면 방을 정리한다 (봇만으로 방 유지 방지).
  if (room.players.length > 0 && room.players.every((p) => p.isBot)) {
    room.players = [];
    if (room.botFillTimer) {
      clearTimeout(room.botFillTimer);
      room.botFillTimer = null;
    }
  }

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
    // 방장은 사람에게만 승계 (봇 방장 방지)
    const nextHost = room.players.find((p) => !p.isBot) ?? room.players[0];
    nextHost.isHost = true;
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

  // 게임 진행 중·대기 중에는 즉시 제거하지 않고 유예 기간 동안 좌석을 유지한다.
  // (폰 잠금/백그라운드로 소켓이 끊겨도 돌아올 때까지 자리를 지킨다)
  if (
    (room.status === "playing" || room.status === "waiting") &&
    leavingPlayer.userId
  ) {
    leavingPlayer.disconnected = true;

    // 대기방의 다른 사람들에게 '연결 대기' 상태를 반영
    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });

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
      // 현재 라운드 남은 시간(ms). 클라 타이머가 풀 10초로 리셋되지 않게.
      roundEndsInMs: Math.max(0, room.roundEndsAt - Date.now()),
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
  socket.on("room:create", ({ nickname }: { nickname: string }) => {
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
      roundEndsAt: 0,
    };

    rooms.set(code, room);
    socket.join(code);

    socket.emit("room:created", roomState(room));

    console.log(`[Room] Created: ${code} by ${nickname}`);
  });

  // -- Room: Quick Match --
  // 대기 중인 퀵매치 방에 합류하거나, 없으면 방을 만들고 일정 시간 후
  // 봇으로 인원을 채워 자동 시작한다. (빈 방 문제 해결 — 혼자여도 멀티 성립)
  socket.on("room:quickmatch", ({ nickname }: { nickname: string }) => {
    const uid = (socket as Socket & { userId?: string }).userId;

    // 1) 합류 가능한 퀵매치 방 탐색 (대기 중 + 사람 있음 + 자리 있음)
    for (const [code, room] of rooms.entries()) {
      if (!room.quickMatch || room.status !== "waiting") continue;
      const humans = room.players.filter((p) => !p.isBot);
      if (humans.length === 0) continue;
      if (room.players.length >= QUICKMATCH_TARGET) continue;
      if (uid && room.players.some((p) => p.userId === uid)) continue; // 같은 유저 중복 방지

      const player: Player = {
        id: socket.id,
        socketId: socket.id,
        nickname,
        status: "ready", // 퀵매치는 준비 단계 없이 자동 시작
        isHost: false,
        userId: uid,
      };
      room.players.push(player);
      socket.join(code);
      io.to(code).emit("room:updated", roomState(room));
      console.log(`[QuickMatch] ${nickname} joined ${code}`);
      return;
    }

    // 2) 없으면 새 퀵매치 방 생성
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const host: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname,
      status: "waiting",
      isHost: true,
      userId: uid,
    };

    const room: Room = {
      code,
      players: [host],
      status: "waiting",
      deck: [],
      results: [],
      currentRound: 0,
      roundPlacements: new Set(),
      roundTimer: null,
      roundEndsAt: 0,
      quickMatch: true,
    };
    rooms.set(code, room);
    socket.join(code);
    socket.emit("room:created", roomState(room));
    console.log(`[QuickMatch] Created ${code} by ${nickname}`);

    // 3) 일정 시간 후 봇으로 채우고 자동 시작
    armQuickMatchAutoStart(io, code);
  });

  // -- Room: List (public waiting rooms) --
  socket.on("room:list", () => {
    const list = [...rooms.values()]
      // 퀵매치 방은 자동 시작이라 공개 목록에서 제외
      .filter((r) => r.status === "waiting" && r.players.length > 0 && !r.quickMatch)
      .map((r) => ({
        code: r.code,
        hostNickname: (r.players.find((p) => p.isHost) ?? r.players[0]).nickname,
        playerCount: r.players.length,
        maxPlayers: MAX_PLAYERS,
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

    if (room.players.length >= MAX_PLAYERS) {
      socket.emit("room:error", { message: "방이 가득 찼습니다" });
      return;
    }

    // 동시 join 경쟁으로 같은 소켓이 이미 좌석을 잡았을 수 있다.
    // 중복 추가(같은 socketId 2개) 방지를 위해 push 직전에 재확인한다.
    if (room.players.some((p) => p.socketId === socket.id)) {
      socket.join(code);
      socket.emit("room:updated", roomState(room));
      return;
    }

    // 방장 승계: 방에 방장이 없으면(방장이 이탈해 좌석이 비었던 방 등)
    // 새로 들어오는 플레이어가 방장이 된다. (유령 무방장 방 방지)
    const hostExists = room.players.some((p) => p.isHost);

    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname,
      status: "waiting",
      isHost: !hostExists,
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
  // 명시적 나가기(버튼): 게임 중이어도 좌석을 즉시 제거해 남은 플레이어가
  // 유령 좌석을 기다리지 않게 한다. 재접속 유예(handleLeave)는 disconnect 전용.
  socket.on("room:leave", ({ code }: { code: string }) => {
    socket.leave(code);
    removePlayerNow(io, code, socket.id);
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
      // 봇은 항상 준비 상태 유지 (다시하기 후 게임 시작 가능하도록)
      p.status = p.isBot ? "ready" : "waiting";
    });
    room.botBoards = new Map();

    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
      quickMatch: room.quickMatch ?? false,
    });

    // 퀵매치 방은 재경기도 자동 시작 (수동 시작 버튼 없음)
    if (room.quickMatch) armQuickMatchAutoStart(io, code);

    console.log(`[Room] Play again in ${code}`);
  });
};
