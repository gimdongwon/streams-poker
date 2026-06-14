"use client";

import { useEffect, useCallback, useRef } from "react";
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
import { ResultScreen } from "./ResultScreen";
import { TIMER_SECONDS } from "@/types/game";
import { Logo } from "@/components/common/Logo";
import { MuteButton } from "@/components/common/MuteButton";
import { playSound } from "@/lib/sound";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

type GameScreenProps = {
  mode: "single" | "multi";
  playerName: string;
  playerId: string;
  onBackToLobby: () => void;
  onPlayAgain?: () => void;
};

export const GameScreen = ({
  mode,
  playerName,
  playerId,
  onBackToLobby,
  onPlayAgain,
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
    resetGame,
  } = useGameStore();

  const {
    playerResults,
    multiDeck,
    submitResult,
    players,
    roundPlacedPlayers,
    emitPlaced,
  } = useRoomStore();

  const hasSavedRef = useRef(false);
  const placedEmittedRoundRef = useRef(0);
  const resultSoundPlayedRef = useRef(false);

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
      // 싱글·멀티 모두 자신의 게임 결과를 기록 → 유저 누적 점수에 합산된다
      // (누적 점수/순위는 랭킹보드에서만 노출)
      if (hasSavedRef.current || !playerId) return;
      hasSavedRef.current = true;

      try {
        const res = await fetchWithTimeout("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: playerId,
            nickname: playerName,
            score: totalScore,
            combinations: comboNames,
            combination_count: comboNames.length,
            mode,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit");
      } catch {
        hasSavedRef.current = false;
      }
    },
    [mode, playerName, playerId]
  );

  const handleEvaluate = useCallback(() => {
    const results = evaluateSlots(slots);
    const total = calculateTotalScore(results);
    const tiebreaker = calculateTiebreaker(results);
    setCombinations(results);
    setScore(total);

    const comboNames = results.map((r) => r.name);

    if (mode === "multi") {
      const boardSlots = slots.map((s) => s.card);
      const resultCombos = results.map((r) => ({
        type: r.type,
        name: r.name,
        score: r.score,
        slotIndices: r.slotIndices,
      }));
      submitResult(total, comboNames, tiebreaker, boardSlots, resultCombos);
    }

    // 싱글·멀티 모두 글로벌 리더보드에 기록 (각 클라이언트가 자신의 결과 저장)
    handleSubmitScore(total, comboNames);
  }, [slots, setCombinations, setScore, mode, submitResult, handleSubmitScore]);

  useEffect(() => {
    if (phase === "game_over") {
      handleEvaluate();
    }
  }, [phase, handleEvaluate]);

  // Play a result sound once when the game ends.
  useEffect(() => {
    if (phase !== "game_over" || resultSoundPlayedRef.current) return;
    resultSoundPlayedRef.current = true;

    if (mode === "single") {
      playSound("win");
    } else {
      const myResult = playerResults.find((r) => r.isMe);
      playSound(myResult && myResult.rank === 1 ? "win" : "reveal");
    }
  }, [phase, mode, playerResults]);

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

  const handleSinglePlayAgain = () => {
    hasSavedRef.current = false;
    resetGame();
  };

  if (phase === "game_over") {
    return (
      <ResultScreen
        mode={mode}
        playerName={playerName}
        slots={slots}
        combinations={combinations}
        totalScore={score}
        playerResults={playerResults}
        onBackToLobby={onBackToLobby}
        onPlayAgain={mode === "multi" ? onPlayAgain : handleSinglePlayAgain}
      />
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
        <div className="flex items-center gap-1">
          <RoundInfo currentRound={currentRound} />
          <MuteButton />
        </div>
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
