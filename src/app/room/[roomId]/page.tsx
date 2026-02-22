"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket, getSocket } from "@/lib/socket";
import { Logo } from "@/components/common/Logo";
import type { Player } from "@/types/room";
import { MAX_PLAYERS } from "@/types/room";

const RoomPage = () => {
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

  const handleStart = useCallback(() => {
    clearError();
    startGame();
  }, [startGame, clearError]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    router.push("/lobby");
  }, [leaveRoom, router]);

  if (!hasHydrated || !isLoggedIn || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex flex-col items-center landscape:justify-start portrait:justify-center p-3 landscape:py-2 overflow-auto">
      <Logo size="sm" className="mb-2 landscape:mb-1" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3 landscape:mb-2"
      >
        <h2 className="text-lg font-black text-white mb-2">대기방</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400 text-xs">방 코드:</span>
          <button
            onClick={handleCopyCode}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-lg font-mono tracking-[0.2em] text-yellow-400 hover:bg-gray-700 transition-colors"
            aria-label="방 코드 복사"
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
                복사됨!
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
            <p className="text-gray-500 text-xs mt-1">잠시 후 로비로 이동합니다...</p>
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
          className="w-full landscape:flex-1 landscape:min-w-0 max-w-sm landscape:max-w-none bg-gray-800/60 rounded-2xl border border-gray-700 p-3 order-2 landscape:order-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">
              플레이어 ({players.length}/{MAX_PLAYERS})
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
              <p className="text-gray-500 text-center py-6 text-sm">
                연결 중...
              </p>
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
              disabled={!canStart}
              className={`w-full py-5 px-5 text-base font-bold rounded-2xl transition-all ${
                canStart
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white active:scale-95 shadow-lg shadow-green-500/20"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
              aria-label="게임 시작"
            >
              {!canStart && players.length < 2
                ? "최소 2명이 필요합니다"
                : !canStart
                  ? "모든 플레이어가 Ready 해야 합니다"
                  : "게임 시작!"}
            </button>
          ) : currentPlayer ? (
            <button
              onClick={toggleReady}
            className={`w-full py-5 px-5 text-base font-bold rounded-2xl transition-all active:scale-95 ${
              currentPlayer.status === "ready"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
            }`}
              aria-label={currentPlayer.status === "ready" ? "대기로 변경" : "준비 완료"}
            >
              {currentPlayer.status === "ready" ? "Ready 취소" : "Ready!"}
            </button>
          ) : null}

          <button
            onClick={handleLeave}
            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-medium rounded-2xl transition-all border border-gray-700"
            aria-label="방 나가기"
          >
            방 나가기
          </button>

          <p className="text-gray-600 text-[10px] text-center mt-1">
            방 코드를 친구에게 공유하여 초대하세요
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-xl ${
        isCurrentPlayer
          ? "bg-purple-900/30 border border-purple-700/50"
          : "bg-gray-700/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
          {player.nickname[0]?.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            {player.nickname}
          </span>
          {isCurrentPlayer && (
            <span className="text-purple-400 text-[10px]">(나)</span>
          )}
          {player.isHost && (
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              방장
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            player.status === "ready" ? "bg-green-500" : "bg-gray-600"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            player.status === "ready" ? "text-green-400" : "text-gray-500"
          }`}
        >
          {player.status === "ready" ? "READY" : "대기중"}
        </span>
      </div>
    </motion.div>
  );
};

export default RoomPage;
