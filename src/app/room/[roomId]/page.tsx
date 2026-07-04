"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket, getSocket } from "@/lib/socket";
import { Logo } from "@/components/common/Logo";
import { Spinner } from "@/components/common/Spinner";
import type { Player } from "@/types/room";
import { MAX_PLAYERS } from "@/types/room";
import { useT } from "@/lib/i18n/useT";

const RoomPage = () => {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const {
    players,
    status,
    roomCode,
    error,
    toggleReady,
    startGame,
    leaveRoom,
    clearError,
    resetRoom,
    initSocketListeners,
    cleanupSocketListeners,
  } = useRoomStore();

  const { user, isLoggedIn, hasHydrated } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const joinedRef = useRef(false);

  const mySocketId = typeof window !== "undefined" ? getSocket().id : null;
  const currentPlayer = players.find((p) => p.id === mySocketId);
  const isHost = currentPlayer?.isHost ?? false;
  const allOthersReady =
    players.filter((p) => !p.isHost).every((p) => p.status === "ready") &&
    players.length >= 2;
  const canStart = isHost && allOthersReady;

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.replace("/login");
    }
  }, [hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    if (!hasHydrated || !isLoggedIn || !user) return;

    initSocketListeners();

    const socket = connectSocket();
    const nickname = user.nickname ?? "Player";

    const handleConnect = () => {
      if (!joinedRef.current) {
        joinedRef.current = true;
        socket.emit("room:join", { code: roomId, nickname });
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    return () => {
      socket.off("connect", handleConnect);
      cleanupSocketListeners();
      joinedRef.current = false;
    };
  }, [hasHydrated, isLoggedIn, user]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "playing") {
      router.push(`/game/${roomCode || roomId}`);
    }
  }, [status, roomCode, roomId, router]);

  useEffect(() => {
    if (error && players.length === 0) {
      const timeout = setTimeout(() => {
        resetRoom();
        router.replace("/lobby");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [error, players.length, resetRoom, router]);

  const handleCopyCode = useCallback(() => {
    const code = roomCode || roomId;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode, roomId]);

  // 시작 대기 상태. 에러가 나면 자동으로 해제된다(별도 effect 불필요).
  const startPending = starting && !error;

  const handleStart = useCallback(() => {
    if (startPending) return;
    setStarting(true);
    clearError();
    startGame();
  }, [startGame, clearError, startPending]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    router.push("/lobby");
  }, [leaveRoom, router]);

  if (!hasHydrated || !isLoggedIn || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col items-center landscape:justify-start portrait:justify-center p-3 landscape:py-2 overflow-auto">
      <Logo size="sm" className="mb-2 landscape:mb-1" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3 landscape:mb-2"
      >
        <h2 className="text-lg font-black text-snow mb-2">{t("room.waiting.title")}</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-haze text-[10px] tracking-[2px] uppercase">{t("room.code.label")}</span>
          <button
            onClick={handleCopyCode}
            className="bg-panel border border-neon-cyan/40 rounded-lg px-3 py-1.5 text-lg font-mono tracking-[0.2em] text-neon-cyan hover:bg-edge transition-colors active:scale-95"
            aria-label={t("room.code.copy")}
          >
            {roomCode || roomId}
          </button>
          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-[10px]"
              >
                {t("room.code.copied")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 에러 메시지 (플레이어가 정상 접속 중이면 표시하지 않음) */}
      <AnimatePresence>
        {error && players.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-4"
          >
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-haze text-xs mt-1">{t("room.error.redirect")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인: 좌(플레이어 목록) + 우(액션 버튼) */}
      <div className="flex flex-col landscape:flex-row gap-4 w-full max-w-2xl landscape:items-start items-center">
        {/* 좌측: 플레이어 목록 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full landscape:flex-1 landscape:min-w-0 max-w-sm landscape:max-w-none bg-panel/60 rounded-2xl border border-edge p-3 order-2 landscape:order-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-snow font-bold text-sm">
              {t("room.players.count", { n: players.length, max: MAX_PLAYERS })}
            </h3>
          </div>

          <div className="space-y-1.5 max-h-[45vh] landscape:max-h-[50vh] overflow-y-auto">
            <AnimatePresence>
              {players.map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={index}
                  isCurrentPlayer={player.id === mySocketId}
                />
              ))}
            </AnimatePresence>

            {players.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-haze text-sm">
                <Spinner size="sm" />
                {t("room.players.connecting")}
              </div>
            )}
          </div>
        </motion.div>

        {/* 우측: 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-2 w-full max-w-sm landscape:w-64 landscape:shrink-0 order-1 landscape:order-2"
        >
          {isHost ? (
            <button
              onClick={handleStart}
              disabled={!canStart || startPending}
              style={
                canStart
                  ? { background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }
                  : undefined
              }
              className={`w-full py-5 px-5 text-base font-bold rounded-2xl transition-all ${
                canStart
                  ? "text-void active:scale-95 hover:scale-[1.02] disabled:opacity-70"
                  : "bg-edge text-haze cursor-not-allowed"
              }`}
              aria-label={t("room.start.label")}
            >
              {startPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" colorClassName="border-void" />
                  {t("room.start.starting")}
                </span>
              ) : !canStart && players.length < 2 ? (
                t("room.start.needTwo")
              ) : !canStart ? (
                t("room.start.needReady")
              ) : (
                t("room.start.go")
              )}
            </button>
          ) : currentPlayer ? (
            <button
              onClick={toggleReady}
              style={
                currentPlayer.status === "ready"
                  ? undefined
                  : { background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }
              }
              className={`w-full py-5 px-5 text-base font-bold rounded-2xl transition-all active:scale-95 ${
                currentPlayer.status === "ready"
                  ? "bg-panel border border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10"
                  : "text-void"
              }`}
              aria-label={currentPlayer.status === "ready" ? t("room.ready.toWaiting") : t("room.ready.toReady")}
            >
              {currentPlayer.status === "ready" ? t("room.ready.cancel") : t("room.ready.set")}
            </button>
          ) : null}

          <button
            onClick={handleLeave}
            className="w-full py-2.5 px-4 bg-panel hover:bg-edge text-haze hover:text-snow text-sm font-medium rounded-2xl transition-all border border-edge active:scale-95"
            aria-label={t("room.leave")}
          >
            {t("room.leave")}
          </button>

          <p className="text-haze/70 text-[10px] text-center mt-1">
            {t("room.share.hint")}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

type PlayerRowProps = {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
};

const PlayerRow = ({ player, index, isCurrentPlayer }: PlayerRowProps) => {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-xl ${
        isCurrentPlayer
          ? "bg-neon-cyan/10 border border-neon-cyan/40"
          : "bg-edge/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-void text-sm font-bold"
        >
          {player.nickname[0]?.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-snow text-sm font-medium">
            {player.nickname}
          </span>
          {isCurrentPlayer && (
            <span className="text-neon-cyan text-[10px]">{t("common.you")}</span>
          )}
          {player.isHost && (
            <span className="bg-neon-magenta/20 text-neon-magenta text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {t("room.player.host")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            player.status === "ready" ? "bg-green-500" : "bg-haze/40"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            player.status === "ready" ? "text-green-400" : "text-haze"
          }`}
        >
          {player.status === "ready" ? t("room.player.readyBadge") : t("room.player.waiting")}
        </span>
      </div>
    </motion.div>
  );
};

export default RoomPage;
