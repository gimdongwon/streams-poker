import type { Server as SocketIOServer, Socket } from "socket.io";
import { rooms, userSockets } from "../state";
import { getPublicPlayers } from "../utils";

export const registerAuthHandlers = (io: SocketIOServer, socket: Socket) => {
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
    (socket as Socket & { userId?: string }).userId = userId;
    console.log(`[Auth] Registered userId: ${userId} -> socket: ${socket.id}`);
  });
};
