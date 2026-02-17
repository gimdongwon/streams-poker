"use client";

import { motion } from "framer-motion";
import type { PlayerResult } from "@/types/room";

type MultiResultBoardProps = {
  results: PlayerResult[];
};

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
  2: "bg-gray-400/10 border-gray-400/30 text-gray-300",
  3: "bg-amber-700/15 border-amber-600/30 text-amber-500",
};

const RANK_BADGES: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export const MultiResultBoard = ({ results }: MultiResultBoardProps) => {
  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-5"
    >
      <h3 className="text-lg font-bold text-white text-center mb-4">
        전체 순위
      </h3>

      <div className="space-y-2">
        {results.map((result, index) => {
          const style =
            RANK_STYLES[result.rank] ||
            "bg-gray-700/20 border-gray-700/30 text-gray-500";
          const badge = RANK_BADGES[result.rank] || `${result.rank}`;

          return (
            <motion.div
              key={`${result.nickname}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-xl border ${style} ${
                result.isMe ? "ring-1 ring-purple-500/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{badge}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        result.isMe ? "text-purple-300" : "text-white"
                      }`}
                    >
                      {result.nickname}
                    </span>
                    {result.isMe && (
                      <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                        나
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {result.combinationNames.length > 0
                      ? result.combinationNames.join(", ")
                      : "조합 없음"}
                  </div>
                </div>
              </div>
              <span
                className={`font-bold text-lg ${
                  result.rank === 1 ? "text-yellow-400" : ""
                }`}
              >
                {result.score}점
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
