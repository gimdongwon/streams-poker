"use client";

// 첫 설치 튜토리얼 — 5라운드 고정 덱 + 코치마크.
// 핵심 학습: ① 조합은 인접 슬롯에서만 ② 자리 설계 ③ 페어→트리플 업그레이드.
// 타이머 없음 / 언제든 건너뛰기 가능 / 완료 시 1회 보상(+100, API에서 중복 방지).
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Board } from "@/components/game/Board";
import { GameCard } from "@/components/game/Card";
import { Logo } from "@/components/common/Logo";
import { Spinner } from "@/components/common/Spinner";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import type { Card } from "@/types/card";
import type { Slot, SlotIndex } from "@/types/game";
import { useAuthStore } from "@/stores/authStore";
import { logEvent } from "@/lib/analytics";
import { markTutorialDone } from "@/lib/tutorial";
import { useT } from "@/lib/i18n/useT";

// 고정 시나리오 덱: 7페어 → K페어 → K트리플 업그레이드
const DECK: Card[] = [
  { type: "normal", suit: "spade", rank: "7", id: "tut-spade-7" },
  { type: "normal", suit: "heart", rank: "7", id: "tut-heart-7" },
  { type: "normal", suit: "spade", rank: "K", id: "tut-spade-K" },
  { type: "normal", suit: "diamond", rank: "K", id: "tut-diamond-K" },
  { type: "normal", suit: "club", rank: "K", id: "tut-club-K" },
];

// 라운드별 코치 문구 키 + 추천 슬롯
const STEPS = [
  { msg: "tutorial.step1", rec: 0 },
  { msg: "tutorial.step2", rec: 1 },
  { msg: "tutorial.step3", rec: 5 },
  { msg: "tutorial.step4", rec: 6 },
  { msg: "tutorial.step5", rec: 7 },
] as const;

const markDone = markTutorialDone;

const emptySlots = (): Slot[] =>
  Array.from({ length: 10 }, (_, i) => ({ index: i as SlotIndex, card: null }));

type Phase = "intro" | "playing" | "done";

const TutorialPage = () => {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0); // 0..4
  const [slots, setSlots] = useState<Slot[]>(emptySlots());
  const [locked, setLocked] = useState(false); // 배치 직후 잠깐 잠금 (연타 방지)
  const [reward, setReward] = useState<{ state: "idle" | "loading" | "done"; amount: number }>({
    state: "idle",
    amount: 0,
  });

  const combos = useMemo(() => evaluateSlots(slots), [slots]);
  const score = useMemo(() => calculateTotalScore(combos), [combos]);

  const skip = () => {
    markDone();
    logEvent("tutorial_skip", { step });
    router.push("/lobby");
  };

  const claimAndFinish = async () => {
    markDone();
    if (reward.state !== "idle") return;
    setReward({ state: "loading", amount: 0 });
    try {
      if (user?.id) {
        const res = await fetch("/api/tutorial/reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json().catch(() => ({}));
        setReward({ state: "done", amount: data?.rewarded ? data.reward : 0 });
      } else {
        setReward({ state: "done", amount: 0 });
      }
    } catch {
      setReward({ state: "done", amount: 0 });
    }
  };

  const handlePlace = (index: SlotIndex) => {
    if (phase !== "playing" || locked) return;
    if (slots[index].card !== null) return;
    const card = DECK[step];
    if (!card) return;

    setSlots((prev) => prev.map((s) => (s.index === index ? { ...s, card } : s)));
    setLocked(true);

    setTimeout(() => {
      setLocked(false);
      if (step >= STEPS.length - 1) {
        setPhase("done");
        markDone();
        logEvent("tutorial_complete");
        claimAndFinish();
      } else {
        setStep((s) => s + 1);
      }
    }, 900);
  };

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col p-3 safe-pad">
      {/* 헤더: 로고 + 건너뛰기 (항상 노출) */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-haze text-[10px] bg-panel px-1.5 py-0.5 rounded">
            {t("tutorial.title")}
          </span>
        </div>
        <button
          onClick={skip}
          className="py-1.5 px-3 bg-panel hover:bg-edge text-haze hover:text-snow text-xs font-medium rounded-xl border border-edge transition-all active:scale-95"
          aria-label={t("tutorial.skip")}
        >
          {t("tutorial.skip")} →
        </button>
      </div>

      {/* 인트로 */}
      {phase === "intro" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center px-4"
        >
          <span className="text-5xl mb-4">🃏</span>
          <h1 className="text-snow text-xl font-extrabold mb-3">{t("tutorial.intro.title")}</h1>
          <p className="text-haze text-sm leading-relaxed whitespace-pre-line max-w-sm mb-6">
            {t("tutorial.intro.body")}
          </p>
          <button
            onClick={() => {
              setPhase("playing");
              logEvent("tutorial_start");
            }}
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            className="py-3 px-10 text-void text-sm font-extrabold rounded-2xl transition-all active:scale-95 hover:scale-[1.02]"
          >
            {t("tutorial.intro.start")}
          </button>
        </motion.div>
      )}

      {/* 플레이 */}
      {phase === "playing" && (
        <div className="flex-1 min-h-0 flex flex-col landscape:flex-row items-center justify-center gap-4 landscape:gap-8">
          {/* 좌: 현재 카드 + 코치 메시지 */}
          <div className="flex landscape:flex-col items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-haze text-[10px] tracking-[2px] mb-1.5">
                {t("tutorial.round", { n: step + 1, total: STEPS.length })}
              </p>
              {DECK[step] && <GameCard card={DECK[step]} size="md" />}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-[15rem] bg-panel border border-neon-magenta/50 rounded-2xl px-4 py-3 text-center"
              >
                <p className="text-snow text-sm font-bold leading-snug">{t(STEPS[step].msg)}</p>
                <p className="text-haze text-[10px] mt-1.5">{t("tutorial.anywhere")}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 우: 보드 (추천 슬롯 반짝임) */}
          <div className="w-full max-w-[26rem]">
            <Board
              slots={slots}
              isActive={!locked}
              onPlace={handlePlace}
              combinations={combos}
              size="sm"
              showHeader={false}
              pulseSlots={slots[STEPS[step].rec].card === null ? [STEPS[step].rec] : []}
            />
          </div>
        </div>
      )}

      {/* 완료 */}
      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center px-4"
        >
          <h1 className="text-snow text-xl font-extrabold mb-1.5">{t("tutorial.done.title")}</h1>
          <p className="text-neon-cyan text-3xl font-extrabold mb-3">
            {t("tutorial.done.score", { score })}
          </p>
          <p className="text-haze text-sm leading-relaxed max-w-md mb-4">
            {t("tutorial.done.body")}
          </p>
          <div className="mb-6 min-h-6">
            {reward.state === "loading" ? (
              <Spinner size="sm" />
            ) : reward.amount > 0 ? (
              <p className="text-yellow-400 text-sm font-extrabold">
                {t("tutorial.done.reward", { n: reward.amount })}
              </p>
            ) : reward.state === "done" ? (
              <p className="text-haze text-xs">{t("tutorial.done.rewardAlready")}</p>
            ) : null}
          </div>
          <button
            onClick={() => router.push("/lobby")}
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            className="py-3 px-10 text-void text-sm font-extrabold rounded-2xl transition-all active:scale-95 hover:scale-[1.02]"
          >
            {t("tutorial.done.toLobby")}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TutorialPage;
