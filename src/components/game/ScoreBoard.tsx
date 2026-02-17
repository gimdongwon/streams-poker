"use client";

import { motion } from "framer-motion";
import type { ScoredCombination } from "@/types/game";
import { getCardDisplayName } from "@/types/card";

type ScoreBoardProps = {
  combinations: ScoredCombination[];
  totalScore: number;
  onRestart: () => void;
  onBackToLobby?: () => void;
};

export const ScoreBoard = ({
  combinations,
  totalScore,
  onRestart,
  onBackToLobby,
}: ScoreBoardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-6"
    >
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        게임 결과
      </h2>

      {combinations.length > 0 ? (
        <div className="space-y-3 mb-6">
          {combinations.map((combo, index) => (
            <motion.div
              key={`${combo.type}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
            >
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">
                  {combo.name}
                </span>
                <span className="text-gray-400 text-xs">
                  {combo.cards.map((c) => getCardDisplayName(c)).join(" ")}
                </span>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.15 + 0.1 }}
                className="text-yellow-400 font-bold text-lg"
              >
                +{combo.score}점
              </motion.span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <span className="text-gray-500 text-lg">조합 없음</span>
        </div>
      )}

      <div className="border-t border-gray-600 pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium text-lg">총점</span>
          <motion.span
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: combinations.length * 0.15 + 0.2 }}
            className="text-3xl font-black text-yellow-400"
          >
            {totalScore}점
          </motion.span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          aria-label="다시하기"
        >
          다시하기
        </button>

        {onBackToLobby && (
          <button
            onClick={onBackToLobby}
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium rounded-xl transition-all border border-gray-600"
            aria-label="로비로 돌아가기"
          >
            로비로 돌아가기
          </button>
        )}
      </div>
    </motion.div>
  );
};
