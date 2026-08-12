"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Slot as SlotType, SlotIndex, ScoredCombination } from "@/types/game";
import type { PlayerResult, ResultCombo } from "@/types/room";
import type { Card } from "@/types/card";
import { getComboStyle } from "@/lib/comboStyles";
import { Board, type BoardCombo } from "./Board";
import { Logo } from "@/components/common/Logo";
import { MuteButton } from "@/components/common/MuteButton";
import { shareResult } from "@/lib/share";
import { drawResultCard, shareCardImage } from "@/lib/shareCard";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { comboKey } from "@/lib/i18n/combo";

export type DailyResultInfo = {
  rank: number;
  total: number;
  reward: number;
};

type ResultScreenProps = {
  mode: "single" | "multi" | "daily";
  playerName: string;
  // single/daily (own board, from gameStore)
  slots: SlotType[];
  combinations: ScoredCombination[];
  totalScore: number;
  // multi
  playerResults: PlayerResult[];
  // daily (제출 후 순위 정보 — 제출 중이면 null)
  dailyInfo?: DailyResultInfo | null;
  onBackToLobby: () => void;
  onPlayAgain?: () => void;
};

const SCORE_GLOW = "0 0 22px rgba(45,226,230,0.55)";

const ordinal = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

const slotsFromCards = (cards: (Card | null)[]): SlotType[] =>
  Array.from({ length: 10 }, (_, i) => ({
    index: i as SlotIndex,
    card: cards[i] ?? null,
  }));

type BreakdownRow = { type: string; name: string; score: number };

const Breakdown = ({
  combos,
  t,
}: {
  combos: BreakdownRow[];
  t: ReturnType<typeof useT>;
}) => (
  <div className="mt-3 text-center">
    {combos.length > 0 ? (
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {combos.map((c, i) => {
          const st = getComboStyle(c.type);
          return (
            <div key={`${c.type}-${i}`} className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2.5 h-2.5 rounded-[3px] ${st.dot}`} />
              <span className="text-snow">{t(comboKey(c.type))}</span>
              <span className={`font-extrabold ${st.text}`}>+{c.score}</span>
            </div>
          );
        })}
      </div>
    ) : (
      <span className="text-haze text-[11px]">{t("result.noCombo")}</span>
    )}
  </div>
);

const PrimaryButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-center text-[13px] font-extrabold text-void py-2 px-8 rounded-lg active:scale-95 transition-transform"
    style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
  >
    {label}
  </button>
);

const SecondaryButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-center text-[13px] font-bold text-snow py-2 px-7 rounded-lg border border-edge hover:bg-panel active:scale-95 transition-all"
  >
    {label}
  </button>
);

export const ResultScreen = ({
  mode,
  playerName,
  slots,
  combinations,
  totalScore,
  playerResults,
  dailyInfo,
  onBackToLobby,
  onPlayAgain,
}: ResultScreenProps) => {
  const myResult = useMemo(
    () => playerResults.find((r) => r.isMe) ?? null,
    [playerResults]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const t = useT();

  // 결과를 브랜딩된 이미지 카드로 공유/저장
  const handleShareImage = async () => {
    if (sharingImage) return;
    setSharingImage(true);
    try {
      const modeLabel =
        mode === "multi"
          ? t("result.mode.multi")
          : mode === "daily"
          ? t("result.mode.daily")
          : t("result.mode.single");
      const score = mode === "multi" ? myResult?.score ?? 0 : totalScore;
      const rankLine =
        mode === "daily" && dailyInfo
          ? t("result.daily.rank", { rank: dailyInfo.rank, total: dailyInfo.total })
          : mode === "multi" && myResult
          ? `${ordinal(myResult.rank)}`
          : null;
      const comboNames = (
        mode !== "multi"
          ? combinations.map((c) => c.type)
          : (myResult?.combinations ?? []).map((c) => c.type)
      ).map((ty) => t(comboKey(ty)));

      const canvas = drawResultCard({
        modeLabel,
        nickname: playerName,
        score,
        scoreSuffix: t("result.pointSuffix"),
        rankLine,
        combos: comboNames,
        footer: "tentens.kr — TENTENS",
      });
      const outcome = await shareCardImage(canvas);
      if (outcome === "downloaded") {
        setToast(t("result.shareImage.downloaded"));
        setTimeout(() => setToast(null), 2000);
      } else if (outcome === "failed") {
        setToast(t("result.toast.failed"));
        setTimeout(() => setToast(null), 2000);
      }
    } finally {
      setSharingImage(false);
    }
  };

  // 판돈 정산 후 잔액을 최신화 (로비/마이페이지에 반영).
  useEffect(() => {
    useAuthStore.getState().refreshCoins();
  }, []);

  const handleShare = async () => {
    const text =
      mode === "daily"
        ? dailyInfo
          ? t("result.share.daily", {
              n: totalScore,
              rank: dailyInfo.rank,
              total: dailyInfo.total,
            })
          : t("result.share.single", { n: totalScore })
        : mode === "single"
        ? t("result.share.single", { n: totalScore })
        : t("result.share.multi", {
            rank: myResult ? ordinal(myResult.rank) : "",
            n: myResult?.score ?? 0,
          });
    const outcome = await shareResult(text);
    if (outcome === "copied") {
      setToast(t("result.toast.copied"));
      setTimeout(() => setToast(null), 2000);
    } else if (outcome === "failed") {
      setToast(t("result.toast.failed"));
      setTimeout(() => setToast(null), 2000);
    }
  };

  const selected = useMemo(() => {
    if (mode !== "multi") return null;
    return (
      playerResults.find((r) => r.playerId === selectedId) ??
      myResult ??
      playerResults[0] ??
      null
    );
  }, [mode, playerResults, selectedId, myResult]);

  // board + breakdown source depends on mode / selected player
  const boardSlots: SlotType[] =
    mode !== "multi" ? slots : slotsFromCards(selected?.slots ?? []);
  const boardCombos: BoardCombo[] =
    mode !== "multi" ? combinations : selected?.combinations ?? [];
  const breakdownRows: BreakdownRow[] =
    mode !== "multi"
      ? combinations.map((c) => ({ type: c.type, name: c.name, score: c.score }))
      : (selected?.combinations ?? []).map((c: ResultCombo) => ({
          type: c.type,
          name: c.name,
          score: c.score,
        }));
  const boardTotal = mode !== "multi" ? totalScore : selected?.score ?? 0;
  const hasBoard = boardSlots.some((s) => s.card !== null);

  const winner = mode === "multi" ? playerResults[0] ?? null : null;

  // 싱글은 순위 컬럼이 없어 공간이 넓다 → 카드를 키우고 넓게 펼쳐 화면을 채운다.
  // 멀티는 우측 순위판이 있어 콤팩트하게 유지.
  const boardSize = mode !== "multi" ? "md" : "sm";
  const boardWrapClass = mode !== "multi" ? "max-w-[42rem]" : "max-w-[19rem]";

  const actions = (
    <div className="flex justify-end gap-3 shrink-0 pt-2">
      {onPlayAgain ? (
        <SecondaryButton label={t("result.lobby")} onClick={onBackToLobby} />
      ) : (
        <PrimaryButton label={t("result.backToLobby")} onClick={onBackToLobby} />
      )}
      {onPlayAgain && (
        <PrimaryButton
          label={mode === "multi" ? t("result.backToRoom") : t("result.playAgain")}
          onClick={onPlayAgain}
        />
      )}
    </div>
  );

  return (
    <div className="relative h-[100dvh] w-full flex flex-col safe-pad overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-haze text-[10px] bg-panel px-1.5 py-0.5 rounded">
            {mode === "multi" ? t("result.mode.multi") : mode === "daily" ? t("result.mode.daily") : t("result.mode.single")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-haze text-xs">{playerName}</span>
          <button
            onClick={handleShare}
            aria-label={t("result.share.aria")}
            tabIndex={0}
            className="text-haze hover:text-snow p-1.5 rounded-lg hover:bg-edge transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          {/* 이미지 카드로 공유/저장 */}
          <button
            onClick={handleShareImage}
            disabled={sharingImage}
            aria-label={t("result.shareImage.aria")}
            tabIndex={0}
            className="text-haze hover:text-snow p-1.5 rounded-lg hover:bg-edge transition-colors disabled:opacity-50"
          >
            {sharingImage ? (
              <span className="block w-4 h-4 border-2 border-haze border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </button>
          <MuteButton />
        </div>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 z-50 bg-panel border border-edge text-snow text-xs px-3 py-1.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* body: portrait stacks, landscape splits into columns */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row gap-3 overflow-y-auto">
        {/* LEFT — this game's verdict (no cumulative; ranking lives in the leaderboard) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="landscape:w-[30%] flex flex-col items-center text-center landscape:justify-center shrink-0"
        >
          {mode !== "multi" ? (
            <>
              <span className="text-haze text-[10px] tracking-[2px]">{t("result.yourScore")}</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-extrabold text-neon-cyan leading-none"
                  style={{
                    fontSize: "clamp(3.5rem, 11vw, 7rem)",
                    letterSpacing: "-4px",
                    textShadow: SCORE_GLOW,
                  }}
                >
                  {totalScore}
                </span>
                <span className="text-haze text-2xl font-bold">{t("result.pointSuffix")}</span>
              </div>
              {combinations.length > 0 && (
                <div className="mt-2.5 text-[11px] text-haze">
                  {t("result.best", { name: t(comboKey(combinations[0].type)) })}
                </div>
              )}
              {mode === "daily" && dailyInfo && (
                <div className="mt-2 text-sm font-extrabold text-neon-cyan">
                  🏆 {t("result.daily.rank", { rank: dailyInfo.rank, total: dailyInfo.total })}
                  <span className="block text-xs font-bold text-haze mt-0.5">
                    🪙 +{dailyInfo.reward}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <span className="text-haze text-[10px] tracking-[2px]">{t("result.youPlaced")}</span>
              <div
                className="font-extrabold text-neon-cyan leading-none"
                style={{ fontSize: "clamp(3rem, 8.5vw, 5rem)", textShadow: SCORE_GLOW }}
              >
                {myResult ? ordinal(myResult.rank) : "-"}
              </div>
              {myResult && (
                <div className="mt-2 text-sm text-snow">
                  {t("result.myScore")}{" "}
                  <span className="font-extrabold">{t("unit.points", { n: myResult.score })}</span>
                </div>
              )}
              {myResult && (myResult.reward ?? 0) > 0 && (
                <div className="mt-1.5 text-sm font-extrabold text-neon-cyan">
                  🪙 {t("coins.reward.won", { n: (myResult.reward ?? 0).toLocaleString() })}
                </div>
              )}
              {winner && (
                <>
                  <div className="mt-3 text-[10px] tracking-[1px] text-haze">{t("result.winner")}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-snow">
                    <span>🏆</span>
                    <span className="font-extrabold">{winner.nickname}</span>
                    <span className="text-haze">{winner.score}</span>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* MIDDLE — board + breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`landscape:flex-1 min-w-0 flex flex-col items-center landscape:justify-center landscape:border-l landscape:border-edge/60 landscape:pl-3 ${
            mode === "multi" ? "landscape:border-r landscape:pr-3" : ""
          }`}
        >
          <div className={`w-full ${boardWrapClass}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-haze text-[10px] tracking-[2px]">
                {mode === "multi" && selected
                  ? t("result.playerBoard", { nick: selected.nickname })
                  : t("result.myBoard")}
              </span>
              {mode === "multi" && (
                <span className="text-haze/70 text-[10px]">{t("unit.points", { n: boardTotal })}</span>
              )}
            </div>
            {hasBoard ? (
              <Board
                slots={boardSlots}
                isActive={false}
                onPlace={() => {}}
                combinations={boardCombos}
                size={boardSize}
                showHeader={false}
                showComboLabels={false}
              />
            ) : (
              <div className="py-6 text-center text-haze text-xs">{t("result.noBoard")}</div>
            )}
            <Breakdown combos={breakdownRows} t={t} />
          </div>
        </motion.div>

        {/* RIGHT — ranking (multi only) */}
        {mode === "multi" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="landscape:w-[26%] flex flex-col shrink-0"
          >
            <span className="text-haze text-[10px] tracking-[2px] mb-1">{t("result.ranking")}</span>
              <div className="flex flex-col gap-1.5">
                {playerResults.map((r) => {
                  const isSel = (selected?.playerId ?? null) === (r.playerId ?? null);
                  const medal =
                    r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : null;
                  return (
                    <button
                      key={r.playerId ?? r.nickname}
                      onClick={() => r.playerId && setSelectedId(r.playerId)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-panel border text-left transition-colors ${
                        isSel ? "border-neon-cyan" : "border-edge hover:border-edge/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 text-center text-[11px] text-haze shrink-0">
                          {medal ?? r.rank}
                        </span>
                        <span className="text-[12px] text-snow truncate">{r.nickname}</span>
                        {r.isMe && (
                          <span className="text-[8px] font-extrabold text-void bg-neon-cyan px-1.5 py-0.5 rounded-full shrink-0">
                            {t("common.me")}
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[12px] font-extrabold shrink-0 ml-2 ${
                          r.rank === 1 ? "text-neon-cyan" : "text-haze"
                        }`}
                      >
                        {r.score}
                      </span>
                    </button>
                  );
                })}
              </div>
            <p className="text-haze/70 text-[9px] pt-1.5">
              {t("result.tapHint")}
            </p>
          </motion.div>
        )}
      </div>

      {/* footer — actions laid out horizontally across the bottom */}
      {actions}
    </div>
  );
};
