"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket } from "@/lib/socket";
import { maybeShowInterstitialAfterGame } from "@/lib/ads";
import { FullScreenLoading } from "@/components/common/FullScreenLoading";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { Card } from "@/types/card";
import { useState } from "react";

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
  const isDaily = roomId === "daily";
  const [dailyDeck, setDailyDeck] = useState<Card[] | null>(null);
  const { phase, resetGame } = useGameStore();
  const { status, roomCode, resetRoom, playAgain, initSocketListeners, cleanupSocketListeners } = useRoomStore();
  const { user, isLoggedIn, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.push("/lobby");
    }
  }, [hasHydrated, isLoggedIn, router]);

  // 데일리: 시작 API 로 도전권 소진 + 오늘의 덱 수신. 이미 도전했으면 로비로.
  useEffect(() => {
    if (!isDaily || !hasHydrated || !isLoggedIn || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/daily/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        if (res.status === 409) {
          if (!cancelled) router.replace("/lobby");
          return;
        }
        if (!res.ok) throw new Error("daily start failed");
        const data: { deck: Card[] } = await res.json();
        if (!cancelled) setDailyDeck(data.deck);
      } catch {
        if (!cancelled) router.replace("/lobby");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDaily, hasHydrated, isLoggedIn, user?.id, router]);

  useEffect(() => {
    if (isSingle || isDaily || !hasHydrated || !isLoggedIn) return;

    initSocketListeners();

    // 새로고침 등으로 라이브 게임 상태가 없는데 이 방의 재접속 의도가 남아 있으면,
    // 소켓을 연결해 connect 핸들러의 room:rejoin 플로우가 동작하도록 한다.
    if (!roomCode && hasActiveRoomIntent(roomId)) {
      connectSocket();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [isSingle, isDaily, hasHydrated, isLoggedIn, roomId, roomCode, initSocketListeners, cleanupSocketListeners]);

  useEffect(() => {
    if (!isSingle && !isDaily && status === "waiting" && phase === "game_over" && roomCode) {
      resetGame();
      router.push(`/room/${roomCode}`);
    }
  }, [isSingle, isDaily, status, phase, roomCode, resetGame, router]);

  const handleBackToLobby = useCallback(async () => {
    // 게임(싱글/멀티)을 "끝까지" 마치고 로비로 나가는 경우에만 판수를 세고,
    // N판마다 전면 광고 1회 (결과 확인 후 자연 휴지기 — 광고 실패 시 그대로 진행).
    // 멀티 "다시하기"는 다른 플레이어가 기다리므로 광고를 넣지 않는다.
    if (phase === "game_over") {
      await maybeShowInterstitialAfterGame();
    }
    resetGame();
    resetRoom();
    router.push("/lobby");
  }, [phase, resetGame, resetRoom, router]);

  const handlePlayAgain = useCallback(() => {
    playAgain();
  }, [playAgain]);

  if (!hasHydrated || !isLoggedIn) return <FullScreenLoading />;

  // 데일리: 덱 수신 전 로딩
  if (isDaily && !dailyDeck) return <FullScreenLoading />;

  return (
    <main className="min-h-screen bg-void">
      <GameScreen
        mode={isDaily ? "daily" : isSingle ? "single" : "multi"}
        playerName={user?.nickname ?? "Player"}
        playerId={user?.id ?? ""}
        externalDeck={dailyDeck}
        onBackToLobby={handleBackToLobby}
        onPlayAgain={isSingle || isDaily ? undefined : handlePlayAgain}
      />
    </main>
  );
};

export default GamePage;
