import type { Server as SocketIOServer, Socket } from "socket.io";
import type { Player, Room } from "../types";
import { rooms, ROOM_CLEANUP_GRACE_MS } from "../state";
import { generateRoomCode } from "../deck";
import { getPublicPlayers } from "../utils";
import { checkRoundCompletion } from "../rounds";

export const handleLeave = (io: SocketIOServer, socket: Socket, code: string) => {
  const room = rooms.get(code);
  if (!room) return;

  const leavingPlayer = room.players.find((p) => p.socketId === socket.id);
  room.players = room.players.filter((p) => p.socketId !== socket.id);
  room.roundPlacements.delete(socket.id);
  socket.leave(code);

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

  if (leavingPlayer?.isHost && room.players.length > 0) {
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

  console.log(`[Room] Player left ${code}, ${room.players.length} remaining`);
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
    };

    rooms.set(code, room);
    socket.join(code);

    socket.emit("room:created", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });

    console.log(`[Room] Created: ${code} by ${nickname}`);
  });

  // -- Room: Join --
  socket.on("room:join", ({ code, nickname }: { code: string; nickname: string }) => {
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
      socket.emit("room:updated", {
        code,
        players: getPublicPlayers(room.players),
        status: room.status,
      });
      return;
    }

    if (room.players.length >= 10) {
      socket.emit("room:error", { message: "방이 가득 찼습니다" });
      return;
    }

    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      nickname,
      status: "waiting",
      isHost: false,
    };

    room.players.push(player);
    socket.join(code);

    io.to(code).emit("room:updated", {
      code,
      players: getPublicPlayers(room.players),
      status: room.status,
    });

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
