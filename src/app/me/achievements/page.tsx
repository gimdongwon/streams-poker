"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { Spinner } from "@/components/common/Spinner";
import { FullScreenLoading } from "@/components/common/FullScreenLoading";

type AchievementItem = {
  id: string;
  emoji: string;
  reward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  isNew: boolean;
};

const AchievementsPage = () => {
  const t = useT();
  const router = useRouter();
  const { user, isLoggedIn, hasHydrated, refreshCoins } = useAuthStore();
  const [items, setItems] = useState<AchievementItem[] | null>(null);
  const [newReward, setNewReward] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.replace("/login");
  }, [hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/achievements?userId=${user.id}`);
        if (!res.ok) throw new Error("failed");
        const data: {
          achievements: AchievementItem[];
          newlyUnlocked: string[];
          newReward: number;
        } = await res.json();
        if (cancelled) return;
        setItems(data.achievements);
        setNewReward(data.newReward);
        // 신규 달성 보상이 지급됐으면 잔액 갱신
        if (data.newReward > 0) refreshCoins();
      } catch {
        if (!cancelled) setHasError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshCoins]);

  if (!hasHydrated || !isLoggedIn || !user) return <FullScreenLoading />;

  const unlockedCount = items?.filter((a) => a.unlocked).length ?? 0;
  const newCount = items?.filter((a) => a.isNew).length ?? 0;

  return (
    <main className="scroll-screen bg-void text-snow safe-pad-x">
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-10 bg-void/95 backdrop-blur-sm border-b border-edge">
        <div className="mx-auto w-full max-w-2xl px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/me" className="text-haze hover:text-snow text-xs shrink-0">
              {t("common.back")}
            </Link>
            <span className="text-snow text-sm font-bold">🏅 {t("ach.title")}</span>
          </div>
          {items && (
            <span className="text-haze text-xs">
              {t("ach.progress", { n: unlockedCount, total: items.length })}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-6">
        {/* 신규 달성 배너 */}
        <AnimatePresence>
          {newCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl px-4 py-3 text-void text-sm font-extrabold text-center"
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            >
              {t("ach.newBanner", { n: newCount, coins: newReward })}
            </motion.div>
          )}
        </AnimatePresence>

        {hasError ? (
          <p className="text-haze text-center text-sm py-16">{t("leaderboard.error")}</p>
        ) : !items ? (
          <div className="py-16 flex items-center justify-center gap-2 text-haze text-sm">
            <Spinner size="sm" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((a) => (
              <div
                key={a.id}
                className={`relative rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
                  a.unlocked
                    ? "bg-panel border-neon-cyan/40"
                    : "bg-panel/40 border-edge opacity-60"
                }`}
              >
                <span
                  className={`text-3xl shrink-0 ${a.unlocked ? "" : "grayscale"}`}
                  aria-hidden="true"
                >
                  {a.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-snow truncate">
                      {t(`ach.${a.id}.name`)}
                    </span>
                    {a.isNew && (
                      <span className="text-[8px] text-void bg-neon-magenta px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        {t("ach.new")}
                      </span>
                    )}
                  </div>
                  <p className="text-haze text-xs mt-0.5 leading-relaxed">
                    {t(`ach.${a.id}.desc`)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className={a.unlocked ? "text-neon-cyan font-bold" : "text-haze"}>
                      🪙 +{a.reward}
                    </span>
                    {a.unlocked && a.unlockedAt && (
                      <span className="text-haze">
                        {new Date(a.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                    {!a.unlocked && (
                      <span className="text-haze">{t("ach.locked")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AchievementsPage;
