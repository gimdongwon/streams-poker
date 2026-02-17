"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import type { Player } from "@/types/room";
import { MAX_PLAYERS } from "@/types/room";

const RoomPage = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const {
    players,
    status,
    currentPlayerId,
    roomCode,
    toggleReady,
    startGame,
    leaveRoom,
    createRoom,
    nickname,
  } = useRoomStore();

  const [copied, setCopied] = useState(false);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const allOthersReady =
    players.filter((p) => !p.isHost).every((p) => p.status === "ready") &&
    players.length >= 2;
  const canStart = isHost && allOthersReady;

  useEffect(() => {
    if (!currentPlayerId && nickname) {
      createRoom();
    }
  }, [currentPlayerId, nickname, createRoom]);

  useEffect(() => {
    if (status === "playing") {
      router.push(`/game/${roomId}`);
    }
  }, [status, roomId, router]);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    const success = startGame();
    if (success) {
      router.push(`/game/${roomId}`);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-black text-white mb-2">대기방</h1>
        <div className="flex items-center justify-center gap-3">
          <span className="text-gray-400 text-sm">방 코드:</span>
          <button
            onClick={handleCopyCode}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-xl font-mono tracking-[0.2em] text-yellow-400 hover:bg-gray-700 transition-colors"
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
                className="text-green-400 text-xs"
              >
                복사됨!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 플레이어 목록 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-gray-800/60 rounded-2xl border border-gray-700 p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold">
            플레이어 ({players.length}/{MAX_PLAYERS})
          </h2>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {players.map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <p className="text-gray-500 text-center py-6 text-sm">
              플레이어를 기다리는 중...
            </p>
          )}
        </div>
      </motion.div>

      {/* 액션 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3 w-full max-w-md"
      >
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full py-4 px-6 text-lg font-bold rounded-2xl transition-all ${
              canStart
                ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
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
        ) : (
          <button
            onClick={toggleReady}
            className={`w-full py-4 px-6 text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 ${
              currentPlayer?.status === "ready"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
            }`}
            aria-label={
              currentPlayer?.status === "ready" ? "대기로 변경" : "준비 완료"
            }
          >
            {currentPlayer?.status === "ready"
              ? "Ready 취소"
              : "Ready!"}
          </button>
        )}

        <button
          onClick={handleLeave}
          className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-medium rounded-2xl transition-all border border-gray-700"
          aria-label="방 나가기"
        >
          방 나가기
        </button>
      </motion.div>

      {/* 안내 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 text-xs mt-6 text-center"
      >
        방 코드를 친구에게 공유하여 초대하세요
      </motion.p>
    </div>
  );
};

type PlayerRowProps = {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
};

const PlayerRow = ({ player, index, isCurrentPlayer }: PlayerRowProps) => {
  const statusColor =
    player.status === "ready"
      ? "bg-green-500"
      : "bg-gray-600";

  const statusText =
    player.status === "ready" ? "READY" : "대기중";

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
        <div>
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
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span
          className={`text-xs font-medium ${
            player.status === "ready" ? "text-green-400" : "text-gray-500"
          }`}
        >
          {statusText}
        </span>
      </div>
    </motion.div>
  );
};

export default RoomPage;
