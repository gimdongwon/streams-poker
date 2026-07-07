"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserRankingEntry, LeaderboardSort } from "@/types/leaderboard";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { TierBadge } from "@/components/common/TierBadge";
import { useT } from "@/lib/i18n/useT";
import { comboKey, comboTypeFromKoName } from "@/lib/i18n/combo";

type LeaderboardProps = {
  highlightNickname?: string;
  highlightUserId?: string;
};

const MEDAL = ["🥇", "🥈", "🥉"] as const;

export const Leaderboard = ({
  highlightNickname,
  highlightUserId,
}: LeaderboardProps) => {
  const t = useT();
  const [entries, setEntries] = useState<UserRankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sort, setSort] = useState<LeaderboardSort>("score");

  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetchWithTimeout(`/api/leaderboard?limit=10&sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: UserRankingEntry[] = await res.json();
      setEntries(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  if (isLoading) {
    return (
      <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-6">
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-haze text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-6">
        <p className="text-haze text-center text-sm py-4">{t("leaderboard.error")}</p>
        <button
          onClick={handleFetch}
          className="w-full py-2 text-neon-cyan hover:text-neon-cyan/80 text-sm transition-colors"
          aria-label={t("common.retry")}
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-snow flex items-center gap-2">
          <span>🏆</span> {t("leaderboard.title")}
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-edge overflow-hidden text-[10px] font-medium">
            {(["score", "coins"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-2 py-1 transition-colors ${
                  sort === s
                    ? "bg-neon-cyan text-void font-bold"
                    : "text-haze hover:bg-edge"
                }`}
                aria-pressed={sort === s}
              >
                {t(`leaderboard.sort.${s}`)}
              </button>
            ))}
          </div>
          <button
            onClick={handleFetch}
            className="text-haze hover:text-snow text-xs transition-colors px-2 py-1 rounded-lg hover:bg-edge"
            aria-label={t("common.refresh")}
            tabIndex={0}
          >
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-haze text-center text-sm py-8">
          {t("leaderboard.empty")}
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="grid grid-cols-[2rem_1fr_4rem_4rem_2.5rem] gap-2 px-3 py-1.5 text-haze text-[10px] tracking-[1px] uppercase font-medium">
            <span>#</span>
            <span>{t("leaderboard.col.nickname")}</span>
            <span className={`text-right ${sort === "score" ? "text-neon-cyan" : ""}`}>{t("leaderboard.col.totalScore")}</span>
            <span className={`text-right ${sort === "coins" ? "text-neon-cyan" : ""}`}>{t("leaderboard.col.coins")}</span>
            <span className="text-right">{t("leaderboard.col.games")}</span>
          </div>

          <AnimatePresence>
            {entries.map((entry, index) => {
              const isHighlighted = highlightUserId
                ? entry.user_id === highlightUserId
                : !!highlightNickname && entry.nickname === highlightNickname;
              const isTop3 = index < 3;

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`grid grid-cols-[2rem_1fr_4rem_4rem_2.5rem] gap-2 px-3 py-2.5 rounded-lg items-center transition-colors ${
                    isHighlighted
                      ? "bg-neon-cyan/15 border border-neon-cyan/40"
                      : isTop3
                      ? "bg-edge/50"
                      : "hover:bg-edge/40"
                  }`}
                >
                  <span className="text-sm">
                    {isTop3 ? (
                      MEDAL[index]
                    ) : (
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
                      {isHighlighted && (
                        <span className="text-[8px] text-void bg-neon-cyan px-1.5 py-0.5 rounded-full ml-1.5 font-bold align-middle">
                          {t("common.me")}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 text-haze text-[10px]">
                      <TierBadge totalScore={entry.total_score} size="sm" showLabel={false} />
                      {entry.best_combo && (
                        <span className="text-neon-cyan/90 font-medium">
                          {(() => {
                            const ty = comboTypeFromKoName(entry.best_combo);
                            return ty ? t(comboKey(ty)) : entry.best_combo;
                          })()}
                        </span>
                      )}
                      <span>{t("leaderboard.best", { n: entry.best_score })}</span>
                    </span>
                  </div>

                  <span
                    className={`text-right font-bold text-sm ${
                      sort === "score" && isTop3 ? "text-yellow-400" : "text-snow"
                    }`}
                  >
                    {entry.total_score}
                  </span>

                  <span
                    className={`text-right font-bold text-sm ${
                      sort === "coins" && isTop3 ? "text-yellow-400" : "text-neon-cyan"
                    }`}
                  >
                    {entry.coins.toLocaleString()}
                  </span>

                  <span className="text-right text-haze text-xs">
                    {t("unit.games", { n: entry.games_played })}
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
