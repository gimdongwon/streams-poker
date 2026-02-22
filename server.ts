import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// --- Types ---

type Player = {
  id: string;
  socketId: string;
  nickname: string;
  status: "waiting" | "ready";
  isHost: boolean;
};

type CardData = {
  type: "normal" | "joker";
  suit?: string;
  rank?: string;
  jokerIndex?: number;
  id: string;
};

type GameResult = {
  playerId: string;
  nickname: string;
  score: number;
  combinationNames: string[];
  tiebreaker: number;
};

type Room = {
  code: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
  deck: CardData[];
  results: GameResult[];
  currentRound: number;
  roundPlacements: Set<string>;
  roundTimer: ReturnType<typeof setTimeout> | null;
};

// --- State ---

const rooms = new Map<string, Room>();
const userSockets = new Map<string, string>(); // userId -> socketId

const SUITS = ["spade", "heart", "diamond", "club"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const createGameDeck = (): CardData[] => {
  const deck: CardData[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ type: "normal", suit, rank, id: `${suit}-${rank}` });
    }
  }
  deck.push({ type: "joker", jokerIndex: 1, id: "joker-1" });
  deck.push({ type: "joker", jokerIndex: 2, id: "joker-2" });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, 10);
};

const getPublicPlayers = (players: Player[]) =>
  players.map(({ socketId: _, ...rest }) => rest);

// --- Socket.io ---

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  const ROUND_SAFETY_TIMEOUT = 15000;

  const startRoundTimer = (room: Room, code: string) => {
    if (room.roundTimer) clearTimeout(room.roundTimer);

    room.roundTimer = setTimeout(() => {
      if (room.status !== "playing") return;

      console.log(`[Round] Safety timeout for round ${room.currentRound} in ${code}`);
      advanceRound(room, code);
    }, ROUND_SAFETY_TIMEOUT);
  };

  const advanceRound = (room: Room, code: string) => {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.currentRound += 1;
    room.roundPlacements = new Set();

    io.to(code).emit("game:nextRound", { round: room.currentRound });

    console.log(`[Round] Advanced to round ${room.currentRound} in ${code}`);

    if (room.currentRound <= 10) {
      startRoundTimer(room, code);
    }
  };

  const checkRoundCompletion = (room: Room, code: string) => {
    if (room.roundPlacements.size >= room.players.length) {
      setTimeout(() => advanceRound(room, code), 800);
    }
  };

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // -- Auth: Register userId to detect duplicate sessions --
    socket.on("auth:register", ({ userId }: { userId: string }) => {
      const existingSocketId = userSockets.get(userId);

      if (existingSocketId && existingSocketId !== socket.id) {
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.emit("auth:forceLogout", {
            message: "다른 곳에서 로그인되어 연결이 해제되었습니다",
          });

          for (const [code, room] of rooms.entries()) {
            const idx = room.players.findIndex((p) => p.socketId === existingSocketId);
            if (idx !== -1) {
              room.players.splice(idx, 1);
              existingSocket.leave(code);
              if (room.players.length === 0) {
                // 빈 방이지만 같은 유저가 새 소켓으로 재접속할 수 있으므로 유예
                setTimeout(() => {
                  const r = rooms.get(code);
                  if (r && r.players.length === 0) {
                    rooms.delete(code);
                    console.log(`[Room] Deleted empty room after grace period: ${code}`);
                  }
                }, 5000);
              } else {
                if (room.players[0]) room.players[0].isHost = true;
                io.to(code).emit("room:updated", {
                  code,
                  players: getPublicPlayers(room.players),
                  status: room.status,
                });
              }
            }
          }

          existingSocket.disconnect(true);
          console.log(`[Auth] Force-disconnected old session for userId: ${userId}`);
        }
      }

      userSockets.set(userId, socket.id);
      (socket as typeof socket & { userId?: string }).userId = userId;
      console.log(`[Auth] Registered userId: ${userId} -> socket: ${socket.id}`);
    });

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

    // -- Game: Start --
    socket.on("game:start", ({ code }: { code: string }) => {
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

      const deck = createGameDeck();
      room.deck = deck;
      room.status = "playing";
      room.results = [];
      room.currentRound = 1;
      room.roundPlacements = new Set();

      io.to(code).emit("game:started", { deck });

      startRoundTimer(room, code);

      console.log(`[Game] Started in ${code} with ${room.players.length} players`);
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

      checkRoundCompletion(room, code);
    });

    // -- Game: Submit Result --
    socket.on("game:result", ({ code, score, combinationNames, tiebreaker }: {
      code: string;
      score: number;
      combinationNames: string[];
      tiebreaker: number;
    }) => {
      const room = rooms.get(code);
      if (!room || room.status !== "playing") return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      const alreadySubmitted = room.results.some((r) => r.playerId === player.id);
      if (alreadySubmitted) return;

      room.results.push({
        playerId: player.id,
        nickname: player.nickname,
        score,
        combinationNames,
        tiebreaker: tiebreaker ?? 0,
      });

      console.log(`[Game] ${player.nickname} submitted: ${score}pts (tb:${tiebreaker}) (${room.results.length}/${room.players.length})`);

      if (room.results.length === room.players.length) {
        room.results.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.tiebreaker - a.tiebreaker;
        });
        const rankedResults = room.results.map((r, i) => ({ ...r, rank: i + 1 }));

        room.status = "finished";

        io.to(code).emit("game:results", { results: rankedResults });

        console.log(`[Game] All results in for ${code}`);
      }
    });

    // -- Room: Leave --
    socket.on("room:leave", ({ code }: { code: string }) => {
      handleLeave(socket, code);
    });

    // -- Disconnect --
    socket.on("disconnect", () => {
      // Clean up userSockets mapping
      const socketWithUser = socket as typeof socket & { userId?: string };
      if (socketWithUser.userId) {
        const currentSocketId = userSockets.get(socketWithUser.userId);
        if (currentSocketId === socket.id) {
          userSockets.delete(socketWithUser.userId);
        }
      }

      for (const [code, room] of rooms.entries()) {
        const playerIdx = room.players.findIndex((p) => p.socketId === socket.id);
        if (playerIdx !== -1) {
          handleLeave(socket, code);
          break;
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
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
  });

  const ROOM_CLEANUP_GRACE_MS = 5000;

  function handleLeave(socket: { id: string; leave: (room: string) => void }, code: string) {
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
      checkRoundCompletion(room, code);
    }

    console.log(`[Room] Player left ${code}, ${room.players.length} remaining`);
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
