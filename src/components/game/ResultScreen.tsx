"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Slot as SlotType, SlotIndex, ScoredCombination } from "@/types/game";
import type { PlayerResult, ResultCombo } from "@/types/room";
import type { Card } from "@/types/card";
import { getComboStyle } from "@/lib/comboStyles";
import { Board, type BoardCombo } from "./Board";
import { Logo } from "@/components/common/Logo";

type ResultScreenProps = {
  mode: "single" | "multi";
  playerName: string;
  // single (own board, from gameStore)
  slots: SlotType[];
  combinations: ScoredCombination[];
  totalScore: number;
  // multi
  playerResults: PlayerResult[];
  onBackToLobby: () => void;
  onPlayAgain?: () => void;
};

const CYAN = "#2de2e6";
const SCORE_GLOW = "0 0 22px rgba(45,226,230,0.55)";

const ordinal = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

const slotsFromCards = (cards: (Card | null)[]): SlotType[] =>
  Array.from({ length: 10 }, (_, i) => ({
    index: i as SlotIndex,
    card: cards[i] ?? null,
  }));

type BreakdownRow = { type: string; name: string; score: number };

const Breakdown = ({ combos }: { combos: BreakdownRow[] }) => (
  <div className="mt-2">
    {combos.length > 0 ? (
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {combos.map((c, i) => {
          const st = getComboStyle(c.type);
          return (
            <div key={`${c.type}-${i}`} className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2.5 h-2.5 rounded-[3px] ${st.dot}`} />
              <span className="text-snow">{c.name}</span>
              <span className={`font-extrabold ${st.text}`}>+{c.score}</span>
            </div>
          );
        })}
      </div>
    ) : (
      <span className="text-haze text-[11px]">조합 없음</span>
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
  onBackToLobby,
  onPlayAgain,
}: ResultScreenProps) => {
  const myResult = useMemo(
    () => playerResults.find((r) => r.isMe) ?? null,
    [playerResults]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    mode === "single" ? slots : slotsFromCards(selected?.slots ?? []);
  const boardCombos: BoardCombo[] =
    mode === "single" ? combinations : selected?.combinations ?? [];
  const breakdownRows: BreakdownRow[] =
    mode === "single"
      ? combinations.map((c) => ({ type: c.type, name: c.name, score: c.score }))
      : (selected?.combinations ?? []).map((c: ResultCombo) => ({
          type: c.type,
          name: c.name,
          score: c.score,
        }));
  const boardTotal = mode === "single" ? totalScore : selected?.score ?? 0;
  const hasBoard = boardSlots.some((s) => s.card !== null);

  const winner = mode === "multi" ? playerResults[0] ?? null : null;

  const actions = (
    <div className="flex justify-end gap-3 shrink-0 pt-2">
      {onPlayAgain ? (
        <SecondaryButton label="로비" onClick={onBackToLobby} />
      ) : (
        <PrimaryButton label="로비로 돌아가기" onClick={onBackToLobby} />
      )}
      {onPlayAgain && <PrimaryButton label="한번 더" onClick={onPlayAgain} />}
    </div>
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col p-3 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-haze text-[10px] bg-panel px-1.5 py-0.5 rounded">
            {mode === "single" ? "싱글" : "멀티"}
          </span>
        </div>
        <span className="text-haze text-xs">{playerName}</span>
      </div>

      {/* body: portrait stacks, landscape splits into columns */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row gap-3 overflow-y-auto landscape:overflow-hidden">
        {/* LEFT — this game's verdict (no cumulative; ranking lives in the leaderboard) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="landscape:w-[30%] flex flex-col landscape:justify-center shrink-0"
        >
          {mode === "single" ? (
            <>
              <span className="text-haze text-[10px] tracking-[2px]">YOUR SCORE</span>
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
                <span className="text-haze text-2xl font-bold">점</span>
              </div>
              {combinations.length > 0 && (
                <div className="mt-2.5 text-[11px] text-haze">
                  BEST · {combinations[0].name}
                </div>
              )}
            </>
          ) : (
            <>
              <span className="text-haze text-[10px] tracking-[2px]">YOU PLACED</span>
              <div
                className="font-extrabold text-neon-cyan leading-none"
                style={{ fontSize: "clamp(3rem, 8.5vw, 5rem)", textShadow: SCORE_GLOW }}
              >
                {myResult ? ordinal(myResult.rank) : "-"}
              </div>
              {myResult && (
                <div className="mt-2 text-sm text-snow">
                  내 점수 <span className="font-extrabold">{myResult.score}점</span>
                </div>
              )}
              {winner && (
                <>
                  <div className="mt-3 text-[10px] tracking-[1px] text-haze">WINNER</div>
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
          className={`landscape:flex-1 min-w-0 flex flex-col landscape:border-l landscape:border-edge/60 landscape:pl-3 ${
            mode === "multi" ? "landscape:border-r landscape:pr-3" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-haze text-[10px] tracking-[2px]">
              {mode === "multi" && selected ? `${selected.nickname}의 보드` : "MY BOARD"}
            </span>
            {mode === "multi" && (
              <span className="text-haze/70 text-[10px]">{boardTotal}점</span>
            )}
          </div>
          {hasBoard ? (
            <Board
              slots={boardSlots}
              isActive={false}
              onPlace={() => {}}
              combinations={boardCombos}
              size="sm"
              showHeader={false}
            />
          ) : (
            <div className="py-6 text-center text-haze text-xs">보드 정보 없음</div>
          )}
          <Breakdown combos={breakdownRows} />
        </motion.div>

        {/* RIGHT — ranking (multi only) */}
        {mode === "multi" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="landscape:w-[26%] flex flex-col shrink-0"
          >
            <span className="text-haze text-[10px] tracking-[2px] mb-1">RANKING</span>
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
                            나
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
              플레이어를 누르면 보드를 볼 수 있어요
            </p>
          </motion.div>
        )}
      </div>

      {/* footer — actions laid out horizontally across the bottom */}
      {actions}
    </div>
  );
};
