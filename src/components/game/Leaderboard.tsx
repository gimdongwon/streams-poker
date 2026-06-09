"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LeaderboardEntry } from "@/types/leaderboard";

type LeaderboardProps = {
  highlightNickname?: string;
};

const MEDAL = ["🥇", "🥈", "🥉"] as const;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
};

export const Leaderboard = ({ highlightNickname }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard?limit=10");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: LeaderboardEntry[] = await res.json();
      setEntries(data);
    } catch {
      setError("리더보드를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  if (isLoading) {
    return (
      <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-6">
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-haze text-sm">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-6">
        <p className="text-haze text-center text-sm py-4">{error}</p>
        <button
          onClick={handleFetch}
          className="w-full py-2 text-neon-cyan hover:text-neon-cyan/80 text-sm transition-colors"
          aria-label="다시 시도"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-snow flex items-center gap-2">
          <span>🏆</span> 리더보드
        </h3>
        <button
          onClick={handleFetch}
          className="text-haze hover:text-snow text-xs transition-colors px-2 py-1 rounded-lg hover:bg-edge"
          aria-label="새로고침"
          tabIndex={0}
        >
          새로고침
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-haze text-center text-sm py-8">
          아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] gap-2 px-3 py-1.5 text-haze text-[10px] tracking-[1px] uppercase font-medium">
            <span>#</span>
            <span>닉네임</span>
            <span className="text-right">점수</span>
            <span className="text-right">조합</span>
          </div>

          <AnimatePresence>
            {entries.map((entry, index) => {
              const isHighlighted =
                highlightNickname &&
                entry.nickname === highlightNickname;
              const isTop3 = index < 3;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`grid grid-cols-[2.5rem_1fr_4rem_3.5rem] gap-2 px-3 py-2.5 rounded-lg items-center transition-colors ${
                    isHighlighted
                      ? "bg-neon-cyan/15 border border-neon-cyan/40"
                      : isTop3
                      ? "bg-edge/50"
                      : "hover:bg-edge/40"
                  }`}
                >
                  <span className="text-sm">
                    {isTop3 ? MEDAL[index] : (
                      <span className="text-haze text-xs font-mono">
                        {index + 1}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <span
                      className={`text-sm font-medium truncate block ${
                        isHighlighted ? "text-neon-cyan" : "text-snow"
                      }`}
                    >
                      {entry.nickname}
                    </span>
                    <span className="text-haze text-[10px]">
                      {formatDate(entry.played_at)}
                    </span>
                  </div>

                  <span
                    className={`text-right font-bold text-sm ${
                      isTop3 ? "text-yellow-400" : "text-snow"
                    }`}
                  >
                    {entry.score}
                  </span>

                  <span className="text-right text-haze text-xs">
                    {entry.combination_count}개
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
