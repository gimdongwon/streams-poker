"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { useRoomStore } from "@/stores/roomStore";
import type { SlotIndex } from "@/types/game";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import { maybeShowInterstitialAfterGame } from "@/lib/ads";
import { logGameComplete } from "@/lib/analytics";
import { trackGameForReview, maybeRequestReview } from "@/lib/review";
import { claimReferralIfPending } from "@/lib/referral";
import { EmoteLayer } from "./EmoteLayer";
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
import { useAuthStore } from "@/stores/authStore";
import type { Card } from "@/types/card";
import { type DailyResultInfo } from "./ResultScreen";
import { useT } from "@/lib/i18n/useT";
import { Spinner } from "@/components/common/Spinner";

type GameScreenProps = {
  mode: "single" | "multi" | "daily";
  playerName: string;
  playerId: string;
  // daily: API에서 받은 오늘의 덱 (10장)
  externalDeck?: Card[] | null;
  onBackToLobby: () => void;
  onPlayAgain?: () => void;
};

export const GameScreen = ({
  mode,
  playerName,
  playerId,
  externalDeck,
  onBackToLobby,
  onPlayAgain,
}: GameScreenProps) => {
  const t = useT();
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
    } else if (mode === "daily" && externalDeck && externalDeck.length > 0) {
      startGameWithDeck(externalDeck);
    } else if (mode === "single") {
      startGame();
    }
  }, [phase, mode, multiDeck, externalDeck, startGame, startGameWithDeck]);

  // Round progression: single auto-advance, multi emit placed
  useEffect(() => {
    if (phase !== "round_end") return;

    if (mode !== "multi") {
      const timeout = setTimeout(() => nextRound(), 500);
      return () => clearTimeout(timeout);
    }

    if (placedEmittedRoundRef.current !== currentRound) {
      placedEmittedRoundRef.current = currentRound;
      emitPlaced(currentRound);
    }
  }, [phase, mode, currentRound, emitPlaced, nextRound]);

  const handleSubmitScore = useCallback(
    async () => {
      // 싱글·멀티 모두 자신의 게임 결과를 기록 → 유저 누적 점수에 합산된다.
      // 점수는 서버가 보드(slots)로 재계산하므로 클라 점수는 보내지 않는다(치팅 방지).
      if (hasSavedRef.current || !playerId) return;
      hasSavedRef.current = true;

      try {
        const res = await fetchWithTimeout("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: playerId,
            nickname: playerName,
            slots: slots.map((s) => s.card),
            mode,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit");
      } catch {
        hasSavedRef.current = false;
      }
    },
    [mode, playerName, playerId, slots]
  );

  // 데일리: 제출 후 오늘 순위/보상 정보 (ResultScreen 표시용)
  const [dailyInfo, setDailyInfo] = useState<DailyResultInfo | null>(null);

  const handleSubmitDaily = useCallback(async () => {
    if (hasSavedRef.current || !playerId) return;
    hasSavedRef.current = true;
    try {
      const res = await fetchWithTimeout("/api/daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: playerId, slots: slots.map((s) => s.card) }),
      });
      if (!res.ok) throw new Error("daily submit failed");
      const data: { rank: number; total: number; reward: number } = await res.json();
      setDailyInfo({ rank: data.rank, total: data.total, reward: data.reward });
      // 참여 보상 반영
      useAuthStore.getState().refreshCoins();
    } catch {
      hasSavedRef.current = false;
    }
  }, [playerId, slots]);

  const handleEvaluate = useCallback(() => {
    // 로컬 결과 표시용 계산 (본인 결과 화면). 방 순위·리더보드 점수는 서버가 재계산한다.
    const results = evaluateSlots(slots);
    setCombinations(results);
    setScore(calculateTotalScore(results));

    // 멀티: 방 순위는 서버가 slots 로 재계산 (클라 점수 미전송, 치팅 방지)
    if (mode === "multi") {
      submitResult(slots.map((s) => s.card));
    }

    if (mode === "daily") {
      // 데일리: 오늘의 랭킹에만 기록 (누적 랭킹과 별개)
      handleSubmitDaily();
    } else {
      // 싱글·멀티: 글로벌 리더보드에 기록 (서버가 점수 재계산)
      handleSubmitScore();
    }
  }, [slots, setCombinations, setScore, mode, submitResult, handleSubmitScore, handleSubmitDaily]);

  useEffect(() => {
    if (phase === "game_over") {
      handleEvaluate();
    }
  }, [phase, handleEvaluate]);

  // Play a result sound once when the game ends. (게임 완료 이벤트도 여기서 1회 기록)
  useEffect(() => {
    if (phase !== "game_over" || resultSoundPlayedRef.current) return;
    resultSoundPlayedRef.current = true;

    logGameComplete(mode, score);
    trackGameForReview();

    // 초대 링크로 온 유저의 "첫 게임 완료" 보상 청구 (기록 저장이 서버에 닿을 시간을 두고).
    // ref 미보유/이미 처리된 경우는 내부에서 조용히 no-op.
    if (playerId) {
      setTimeout(() => claimReferralIfPending(playerId), 4000);
    }

    let won = false;
    if (mode !== "multi") {
      playSound("win");
      won = score >= 100;
    } else {
      const myResult = playerResults.find((r) => r.isMe);
      won = myResult?.rank === 1;
      playSound(won ? "win" : "reveal");
    }

    // 기분 좋은 순간(멀티 1등 / 100점 이상)에만 스토어 리뷰 후보 요청.
    // 결과 화면이 자리잡은 뒤에 뜨도록 살짝 지연.
    if (won) {
      setTimeout(() => {
        maybeRequestReview();
      }, 2500);
    }
  }, [phase, mode, playerResults, score, playerId]);

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
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const handleSinglePlayAgain = async () => {
    // 싱글 "한번 더"도 판수에 포함 — N판마다 전면 광고 후 다음 판 시작.
    await maybeShowInterstitialAfterGame();
    hasSavedRef.current = false;
    resetGame();
  };

  // 멀티: 내 제출은 끝났지만 서버 결과(game:results)가 아직 안 온 상태 → 집계 대기 스피너.
  if (phase === "game_over" && mode === "multi" && playerResults.length === 0) {
    return (
      <div className="fixed inset-0 bg-void flex flex-col items-center justify-center gap-3">
        <Spinner size="md" />
        <span className="text-haze text-sm">{t("result.waitingResults")}</span>
      </div>
    );
  }

  if (phase === "game_over") {
    return (
      <ResultScreen
        mode={mode}
        playerName={playerName}
        slots={slots}
        combinations={combinations}
        totalScore={score}
        playerResults={playerResults}
        dailyInfo={dailyInfo}
        onBackToLobby={onBackToLobby}
        onPlayAgain={
          mode === "multi"
            ? onPlayAgain
            : mode === "daily"
            ? undefined // 오늘의 덱은 하루 한 번 — 다시하기 없음
            : handleSinglePlayAgain
        }
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] safe-pad">
      {/* 퀵챗 — 멀티에서만 (싱글은 상대가 없음) */}
      {mode === "multi" && <EmoteLayer />}
      <div className="flex items-center justify-between w-full max-w-3xl py-1 mb-2">
        <div className="flex items-center gap-2">
          {/* 오늘의 덱 진행 중엔 로고 링크도 비활성 (이탈 방지) */}
          <Logo size="sm" link={mode !== "daily"} />
          <span className="text-gray-500 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">
            {mode === "multi"
              ? t("game.mode.multi")
              : mode === "daily"
              ? t("game.mode.daily")
              : t("game.mode.single")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <RoundInfo currentRound={currentRound} />
          <MuteButton />
          {/* 오늘의 덱은 시작 시 도전권이 소진되므로 진행 중 종료 불가 (종료 버튼 미노출) */}
          {mode !== "daily" && (
            <button
              onClick={() => setShowQuitConfirm(true)}
              aria-label={t("game.quit")}
              className="w-7 h-7 rounded-lg border border-edge bg-panel/60 text-haze hover:text-snow hover:bg-edge transition flex items-center justify-center text-sm leading-none active:scale-95"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 게임 나가기 확인 모달 */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-8 py-6 bg-void/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuitConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t("game.quit.title")}
          >
            <motion.div
              className="w-full max-w-xs bg-panel border border-edge rounded-2xl p-6 shadow-xl"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-snow font-bold text-base mb-1.5">{t("game.quit.title")}</h2>
              <p className="text-haze text-xs leading-relaxed mb-4">
                {mode === "multi"
                  ? t("game.quit.desc.multi")
                  : mode === "daily"
                  ? t("game.quit.desc.daily")
                  : t("game.quit.desc.single")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-edge text-haze hover:text-snow hover:bg-edge text-sm font-medium transition"
                >
                  {t("game.quit.cancel")}
                </button>
                <button
                  onClick={onBackToLobby}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold transition"
                >
                  {t("game.quit.confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <span className="text-emerald-400 text-[10px] font-medium">{t("game.status.placed")}</span>
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
                    {t("game.status.placedCount", { n: roundPlacedPlayers.length, total: players.length })}
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
          ? t("game.hint.waiting")
          : t("game.hint.place")}
      </p>
    </div>
  );
};
