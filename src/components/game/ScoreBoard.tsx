"use client";

import { motion } from "framer-motion";
import type { ScoredCombination } from "@/types/game";
import { getCardDisplayName } from "@/types/card";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ScoreBoardProps = {
  combinations: ScoredCombination[];
  totalScore: number;
  onBackToLobby: () => void;
  onPlayAgain?: () => void;
  saveStatus?: SaveStatus;
  playerRank?: number | null;
};

export const ScoreBoard = ({
  combinations,
  totalScore,
  onBackToLobby,
  onPlayAgain,
  saveStatus = "idle",
  playerRank,
}: ScoreBoardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-4"
    >
      <h2 className="text-base font-bold text-white text-center mb-3">
        게임 결과
      </h2>

      {combinations.length > 0 ? (
        <div className="space-y-2 mb-3">
          {combinations.map((combo, index) => (
            <motion.div
              key={`${combo.type}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-gray-700/50 rounded-xl px-3 py-2"
            >
              <div className="flex flex-col min-w-0 mr-3">
                <span className="text-white font-semibold text-sm">
                  {combo.name}
                </span>
                <span className="text-gray-400 text-xs truncate">
                  {combo.cards.map((c) => getCardDisplayName(c)).join(" ")}
                </span>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                className="text-yellow-400 font-bold text-sm shrink-0"
              >
                +{combo.score}점
              </motion.span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 mb-3">
          <span className="text-gray-500 text-sm">조합 없음</span>
        </div>
      )}

      <div className="border-t border-gray-600 pt-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium text-sm">총점</span>
          <motion.span
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: combinations.length * 0.1 + 0.2 }}
            className="text-2xl font-black text-yellow-400"
          >
            {totalScore}점
          </motion.span>
        </div>
      </div>

      <div className="mb-3 text-center text-xs">
        {saveStatus === "saving" && (
          <span className="text-gray-400 flex items-center justify-center gap-1">
            <span className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            저장 중...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-green-400">
            저장 완료{playerRank != null && ` (${playerRank}위)`}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-red-400">저장 실패</span>
        )}
      </div>

      {onPlayAgain ? (
        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
            aria-label="한번더하기"
            tabIndex={0}
          >
            한번더하기
          </button>
          <button
            onClick={onBackToLobby}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold text-sm rounded-xl transition-all active:scale-95 border border-gray-600"
            aria-label="로비로 돌아가기"
            tabIndex={0}
          >
            로비로 돌아가기
          </button>
        </div>
      ) : (
        <button
          onClick={onBackToLobby}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
          aria-label="로비로 돌아가기"
          tabIndex={0}
        >
          로비로 돌아가기
        </button>
      )}
    </motion.div>
  );
};
