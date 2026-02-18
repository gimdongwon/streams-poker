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
  const { resetGame } = useGameStore();
  const { resetRoom, initSocketListeners, cleanupSocketListeners } = useRoomStore();
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

  const handleBackToLobby = useCallback(() => {
    resetGame();
    resetRoom();
    router.push("/lobby");
  }, [resetGame, resetRoom, router]);

  if (!hasHydrated || !isLoggedIn) return null;

  return (
    <main className="min-h-screen bg-gray-900">
      <GameScreen
        mode={isSingle ? "single" : "multi"}
        playerName={user?.nickname ?? "Player"}
        onBackToLobby={handleBackToLobby}
      />
    </main>
  );
};

export default GamePage;
