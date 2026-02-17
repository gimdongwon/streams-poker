"use client";

import { useEffect, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import type { SlotIndex } from "@/types/game";
import {
  evaluateSlots,
  calculateTotalScore,
} from "@/lib/poker/evaluator";
import { Board } from "./Board";
import { CurrentCard } from "./CurrentCard";
import { Timer } from "./Timer";
import { RoundInfo } from "./RoundInfo";
import { ScoreBoard } from "./ScoreBoard";
import { MultiResultBoard } from "./MultiResultBoard";
import { HandRankingsButton } from "./HandRankingsModal";
import { TIMER_SECONDS } from "@/types/game";

type GameScreenProps = {
  mode: "solo" | "multi";
  playerName: string;
  onBackToLobby: () => void;
};

export const GameScreen = ({
  mode,
  playerName,
  onBackToLobby,
}: GameScreenProps) => {
  const {
    phase,
    currentRound,
    currentCard,
    slots,
    timer,
    score,
    combinations,
    placeCard,
    startGame,
    resetGame,
    setScore,
    setCombinations,
  } = useGameStore();

  const { players, playerResults, generateResults } = useRoomStore();

  useEffect(() => {
    if (phase === "idle") {
      startGame();
    }
  }, [phase, startGame]);

  const handleEvaluate = useCallback(() => {
    const results = evaluateSlots(slots);
    const total = calculateTotalScore(results);
    setCombinations(results);
    setScore(total);

    if (mode === "multi" && players.length > 0) {
      const comboNames = results.map((r) => r.name);
      generateResults(total, comboNames);
    }
  }, [slots, setCombinations, setScore, mode, players.length, generateResults]);

  useEffect(() => {
    if (phase === "game_over") {
      handleEvaluate();
    }
  }, [phase, handleEvaluate]);

  const handlePlace = useCallback(
    (index: SlotIndex) => {
      if (phase === "playing") {
        placeCard(index);
      }
    },
    [phase, placeCard]
  );

  const handleRestart = useCallback(() => {
    resetGame();
    startGame();
  }, [resetGame, startGame]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== "playing") return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handlePlace((num - 1) as SlotIndex);
      }
      if (e.key === "0") {
        handlePlace(9 as SlotIndex);
      }
    },
    [phase, handlePlace]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (phase === "game_over") {
    return (
      <div className="flex flex-col min-h-screen p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto pt-4 mb-6">
          <h1 className="text-3xl font-black text-white">STREAMS POKER</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{playerName}</span>
            <span className="text-gray-600 text-xs">
              ({mode === "solo" ? "싱글" : "멀티"})
            </span>
          </div>
        </div>

        {/* 좌: 결과 / 우: 카드덱 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto">
          {/* 좌측: 게임 결과 + 멀티 순위 */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <ScoreBoard
              combinations={combinations}
              totalScore={score}
              onRestart={handleRestart}
              onBackToLobby={onBackToLobby}
            />

            {mode === "multi" && playerResults.length > 0 && (
              <MultiResultBoard results={playerResults} />
            )}
          </div>

          {/* 우측: 카드덱 5x2 그리드 */}
          <div className="lg:w-[460px] shrink-0">
            <Board
              slots={slots}
              isActive={false}
              onPlace={handlePlace}
              combinations={combinations}
              layout="grid"
            />
          </div>
        </div>

        <HandRankingsButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">STREAMS POKER</h1>
          <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">
            {mode === "solo" ? "싱글" : "멀티"}
          </span>
        </div>
        <RoundInfo currentRound={currentRound} />
      </div>

      <Timer seconds={timer} maxSeconds={TIMER_SECONDS} />

      <CurrentCard card={currentCard} />

      <Board
        slots={slots}
        isActive={phase === "playing"}
        onPlace={handlePlace}
      />

      <p className="text-gray-500 text-xs text-center">
        슬롯을 클릭하거나 키보드 1~0 키를 눌러 카드를 배치하세요
      </p>

      <HandRankingsButton />
    </div>
  );
};
