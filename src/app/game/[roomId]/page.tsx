"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";

const GamePage = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const isSingle = roomId === "single";
  const { phase, resetGame } = useGameStore();
  const { status, roomCode, resetRoom, playAgain, initSocketListeners, cleanupSocketListeners } = useRoomStore();
  const { user, isLoggedIn, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.push("/lobby");
    }
  }, [hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    if (isSingle || !hasHydrated || !isLoggedIn) return;

    initSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [isSingle, hasHydrated, isLoggedIn, initSocketListeners, cleanupSocketListeners]);

  useEffect(() => {
    if (!isSingle && status === "waiting" && phase === "game_over" && roomCode) {
      resetGame();
      router.push(`/room/${roomCode}`);
    }
  }, [isSingle, status, phase, roomCode, resetGame, router]);

  const handleBackToLobby = useCallback(() => {
    resetGame();
    resetRoom();
    router.push("/lobby");
  }, [resetGame, resetRoom, router]);

  const handlePlayAgain = useCallback(() => {
    playAgain();
  }, [playAgain]);

  if (!hasHydrated || !isLoggedIn) return null;

  return (
    <main className="min-h-screen bg-gray-900">
      <GameScreen
        mode={isSingle ? "single" : "multi"}
        playerName={user?.nickname ?? "Player"}
        onBackToLobby={handleBackToLobby}
        onPlayAgain={isSingle ? undefined : handlePlayAgain}
      />
    </main>
  );
};

export default GamePage;
