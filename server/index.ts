import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";

import { rooms, userSockets } from "./state";
import { registerAuthHandlers } from "./handlers/auth";
import { registerRoomHandlers, handleLeave } from "./handlers/room";
import { registerGameHandlers } from "./handlers/game";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    registerAuthHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    // -- Disconnect --
    socket.on("disconnect", () => {
      // userSockets 매핑 정리
      const socketWithUser = socket as Socket & { userId?: string };
      if (socketWithUser.userId) {
        const currentSocketId = userSockets.get(socketWithUser.userId);
        if (currentSocketId === socket.id) {
          userSockets.delete(socketWithUser.userId);
        }
      }

      for (const [code, room] of rooms.entries()) {
        const playerIdx = room.players.findIndex((p) => p.socketId === socket.id);
        if (playerIdx !== -1) {
          handleLeave(io, socket, code);
          break;
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
