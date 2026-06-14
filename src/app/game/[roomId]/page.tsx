"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket } from "@/lib/socket";

// 새로고침 후 진행 중이던 방으로 재접속해야 하는지 확인.
const hasActiveRoomIntent = (code: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem("tens-active-room");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { code?: string; inGame?: boolean };
    return Boolean(parsed.inGame) && parsed.code === code;
  } catch {
    return false;
  }
};

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

    // 새로고침 등으로 라이브 게임 상태가 없는데 이 방의 재접속 의도가 남아 있으면,
    // 소켓을 연결해 connect 핸들러의 room:rejoin 플로우가 동작하도록 한다.
    if (!roomCode && hasActiveRoomIntent(roomId)) {
      connectSocket();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [isSingle, hasHydrated, isLoggedIn, roomId, roomCode, initSocketListeners, cleanupSocketListeners]);

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
    <main className="min-h-screen bg-void">
      <GameScreen
        mode={isSingle ? "single" : "multi"}
        playerName={user?.nickname ?? "Player"}
        playerId={user?.id ?? ""}
        onBackToLobby={handleBackToLobby}
        onPlayAgain={isSingle ? undefined : handlePlayAgain}
      />
    </main>
  );
};

export default GamePage;
