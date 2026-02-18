"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import type { SlotIndex } from "@/types/game";
import {
  evaluateSlots,
  calculateTotalScore,
  calculateTiebreaker,
} from "@/lib/poker/evaluator";
import { Board } from "./Board";
import { CurrentCard } from "./CurrentCard";
import { Timer } from "./Timer";
import { RoundInfo } from "./RoundInfo";
import { ScoreBoard } from "./ScoreBoard";
import { MultiResultBoard } from "./MultiResultBoard";
import { TIMER_SECONDS } from "@/types/game";
import { Logo } from "@/components/common/Logo";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type GameScreenProps = {
  mode: "single" | "multi";
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
    nextRound,
    startGame,
    startGameWithDeck,
    setScore,
    setCombinations,
  } = useGameStore();

  const {
    playerResults,
    multiDeck,
    submitResult,
    players,
    roundPlacedPlayers,
    emitPlaced,
  } = useRoomStore();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const hasSavedRef = useRef(false);
  const placedEmittedRoundRef = useRef(0);

  useEffect(() => {
    if (phase !== "idle") return;

    if (mode === "multi" && multiDeck && multiDeck.length > 0) {
      startGameWithDeck(multiDeck);
    } else if (mode === "single") {
      startGame();
    }
  }, [phase, mode, multiDeck, startGame, startGameWithDeck]);

  // Round progression: single auto-advance, multi emit placed
  useEffect(() => {
    if (phase !== "round_end") return;

    if (mode === "single") {
      const timeout = setTimeout(() => nextRound(), 500);
      return () => clearTimeout(timeout);
    }

    if (placedEmittedRoundRef.current !== currentRound) {
      placedEmittedRoundRef.current = currentRound;
      emitPlaced(currentRound);
    }
  }, [phase, mode, currentRound, emitPlaced, nextRound]);

  const handleSubmitScore = useCallback(
    async (totalScore: number, comboNames: string[]) => {
      if (mode !== "single" || hasSavedRef.current) return;
      hasSavedRef.current = true;
      setSaveStatus("saving");

      try {
        const res = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: playerName,
            score: totalScore,
            combinations: comboNames,
            combination_count: comboNames.length,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit");

        const rankRes = await fetch(
          `/api/leaderboard/rank?score=${totalScore}`
        );
        if (rankRes.ok) {
          const { rank } = await rankRes.json();
          setPlayerRank(rank);
        }

        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
        hasSavedRef.current = false;
      }
    },
    [mode, playerName]
  );

  const handleEvaluate = useCallback(() => {
    const results = evaluateSlots(slots);
    const total = calculateTotalScore(results);
    const tiebreaker = calculateTiebreaker(results);
    setCombinations(results);
    setScore(total);

    const comboNames = results.map((r) => r.name);

    if (mode === "multi") {
      submitResult(total, comboNames, tiebreaker);
    }

    if (mode === "single") {
      handleSubmitScore(total, comboNames);
    }
  }, [slots, setCombinations, setScore, mode, submitResult, handleSubmitScore]);

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

  const isWaitingForOthers = phase === "round_end" && mode === "multi";

  if (phase === "game_over") {
    return (
      <div className="min-h-[100dvh] overflow-y-auto p-3">
        <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-1 mb-3">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{playerName}</span>
            <span className="text-gray-600 text-[10px]">
              ({mode === "single" ? "싱글" : "멀티"})
            </span>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto space-y-3">
          {mode === "multi" && (
            <MultiResultBoard
              results={playerResults}
              totalPlayers={players.length}
            />
          )}

          <ScoreBoard
            combinations={combinations}
            totalScore={score}
            onBackToLobby={onBackToLobby}
            saveStatus={saveStatus}
            playerRank={playerRank}
          />

          <div className="flex justify-center pb-4">
            <Board
              slots={slots}
              isActive={false}
              onPlace={handlePlace}
              combinations={combinations}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-3">
      <div className="flex items-center justify-between w-full max-w-3xl py-1 mb-2">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-gray-500 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
            {mode === "single" ? "싱글" : "멀티"}
          </span>
        </div>
        <RoundInfo currentRound={currentRound} />
      </div>

      <div className="flex flex-col landscape:flex-row items-center landscape:items-center landscape:justify-between gap-4 w-full max-w-3xl">
        {/* 왼쪽: 현재 카드 / 대기 상태 */}
        <div className="landscape:order-1 order-1 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {isWaitingForOthers ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                {/* 카드 뒷면 */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-emerald-400 text-[10px] font-medium">배치 완료!</span>
                  <motion.div
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 180 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ perspective: 800 }}
                    className="w-20 h-28"
                  >
                    <div
                      className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-2 border-indigo-400/40 flex items-center justify-center shadow-lg shadow-indigo-900/50"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <div className="w-14 h-20 rounded border border-indigo-400/20 bg-indigo-800/50 flex items-center justify-center">
                        <span className="text-indigo-300/50 text-2xl">♠</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* 플레이어 배치 현황 */}
                <div className="bg-gray-800/90 rounded-xl p-3 backdrop-blur-sm min-w-[160px]">
                  <div className="space-y-1.5">
                    {players.map((p) => {
                      const placed = roundPlacedPlayers.some((rp) => rp.id === p.id);
                      return (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <span className={placed ? "text-emerald-400" : "text-gray-500"}>
                            {placed ? "✅" : "⏳"}
                          </span>
                          <span className={placed ? "text-gray-200" : "text-gray-500"}>
                            {p.nickname}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    {roundPlacedPlayers.length}/{players.length} 배치 완료
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <CurrentCard card={currentCard} />
                <div className="w-44">
                  <Timer seconds={timer} maxSeconds={TIMER_SECONDS} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 보드 (오른쪽) */}
        <div className="landscape:order-2 order-2">
          <Board
            slots={slots}
            isActive={phase === "playing"}
            onPlace={handlePlace}
          />
        </div>
      </div>

      <p className="text-gray-500 text-[10px] text-center mt-2">
        {isWaitingForOthers
          ? "다른 플레이어의 배치를 기다리는 중..."
          : "슬롯을 터치하거나 키보드 1~0으로 배치"}
      </p>
    </div>
  );
};
