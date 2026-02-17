"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { useRoomStore } from "@/stores/roomStore";

const GamePage = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const isSolo = roomId === "solo";
  const { nickname, resetRoom } = useRoomStore();

  const handleBackToLobby = useCallback(() => {
    resetRoom();
    router.push("/lobby");
  }, [resetRoom, router]);

  return (
    <main className="min-h-screen bg-gray-900">
      <GameScreen
        mode={isSolo ? "solo" : "multi"}
        playerName={nickname || "Player"}
        onBackToLobby={handleBackToLobby}
      />
    </main>
  );
};

export default GamePage;
