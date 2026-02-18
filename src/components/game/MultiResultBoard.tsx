"use client";

import { motion } from "framer-motion";
import type { PlayerResult } from "@/types/room";

type MultiResultBoardProps = {
  results: PlayerResult[];
  totalPlayers?: number;
};

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-500/20 border-yellow-500/50",
  2: "bg-gray-400/10 border-gray-400/30",
  3: "bg-amber-700/15 border-amber-600/30",
};

const RANK_BADGES: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export const MultiResultBoard = ({ results, totalPlayers }: MultiResultBoardProps) => {
  if (results.length === 0 && !totalPlayers) return null;

  const winner = results.length > 0 ? results[0] : null;
  const myResult = results.find((r) => r.isMe);
  const isWaiting = results.length === 0 && totalPlayers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
    >
      {/* 대기 상태 */}
      {isWaiting && (
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-300 text-sm font-medium">
            다른 플레이어의 결과를 기다리는 중...
          </p>
          <p className="text-gray-500 text-[10px] mt-1">
            모든 플레이어가 완료하면 결과가 표시됩니다
          </p>
        </div>
      )}

      {/* 결과 표시 */}
      {results.length > 0 && (
        <>
          {/* 우승자 배너 */}
          {winner && (
            <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border-b border-yellow-500/30 px-4 py-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <p className="text-yellow-400 text-lg font-black">
                  🏆 {winner.nickname} 우승!
                </p>
                <p className="text-yellow-500/80 text-xs mt-0.5">
                  {winner.score}점 · {winner.combinationNames.length > 0
                    ? winner.combinationNames.join(", ")
                    : "조합 없음"}
                </p>
                {myResult && myResult.rank === 1 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-yellow-300 text-[10px] font-bold mt-1"
                  >
                    축하합니다! 1등입니다! 🎉
                  </motion.p>
                )}
              </motion.div>
            </div>
          )}

          {/* 전체 순위 */}
          <div className="p-3">
            <h3 className="text-xs font-bold text-gray-400 mb-2">전체 순위</h3>
            <div className="space-y-1.5">
              {results.map((result, index) => {
                const style =
                  RANK_STYLES[result.rank] ||
                  "bg-gray-700/20 border-gray-700/30";
                const badge = RANK_BADGES[result.rank] || `${result.rank}`;

                return (
                  <motion.div
                    key={`${result.nickname}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${style} ${
                      result.isMe ? "ring-1 ring-purple-500/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base w-7 text-center shrink-0">{badge}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-sm truncate ${
                              result.isMe ? "text-purple-300" : "text-white"
                            }`}
                          >
                            {result.nickname}
                          </span>
                          {result.isMe && (
                            <span className="text-[8px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                              나
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-[10px] truncate">
                          {result.combinationNames.length > 0
                            ? result.combinationNames.join(", ")
                            : "조합 없음"}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-base shrink-0 ml-2 ${
                        result.rank === 1 ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      {result.score}점
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
