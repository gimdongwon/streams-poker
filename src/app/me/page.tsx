"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useT } from "@/lib/i18n/useT";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { comboKey, comboTypeFromKoName } from "@/lib/i18n/combo";
import { TierBadge } from "@/components/common/TierBadge";
import { TierInfoModal } from "@/components/common/TierInfoModal";
import { TierProgress } from "@/components/common/TierProgress";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { MuteButton } from "@/components/common/MuteButton";
import { Spinner } from "@/components/common/Spinner";
import { CoinBalance } from "@/components/common/CoinBalance";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { EditNicknameModal } from "@/components/auth/EditNicknameModal";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import type { UserRankInfo } from "@/types/leaderboard";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="w-full">
    <h2 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-2">
      {title}
    </h2>
    {children}
  </section>
);

const StatCell = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-void border border-edge rounded-xl px-3 py-2.5 text-center">
    <p className="text-haze text-[9px] tracking-[1px] uppercase">{label}</p>
    <p className="text-snow font-bold text-sm mt-0.5 truncate">{value}</p>
  </div>
);

const MyPage = () => {
  const router = useRouter();
  const t = useT();
  const { user, isLoggedIn, hasHydrated, logout } = useAuthStore();

  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [showEditNickname, setShowEditNickname] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) router.replace("/login");
  }, [hasHydrated, isLoggedIn, router]);

  const fetchRank = useCallback(async () => {
    if (!user?.id) return;
    setRankLoading(true);
    try {
      const res = await fetchWithTimeout(
        `/api/leaderboard/rank?userId=${user.id}`
      );
      if (!res.ok) return;
      const data: UserRankInfo = await res.json();
      setRankInfo(data);
    } catch {
      // 조회 실패 시 조용히 무시
    } finally {
      setRankLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!hasHydrated || !isLoggedIn || !user) return null;

  const bestComboLabel = (() => {
    if (!rankInfo?.bestCombo) return t("me.stats.none");
    const type = comboTypeFromKoName(rankInfo.bestCombo);
    return type ? t(comboKey(type)) : rankInfo.bestCombo;
  })();

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col items-center p-3 pb-16 overflow-auto">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/lobby"
            className="text-haze hover:text-snow text-sm transition-colors px-2 py-1 rounded-lg hover:bg-edge"
          >
            ← {t("me.back")}
          </Link>
          <h1 className="text-snow font-bold text-sm">{t("me.title")}</h1>
          <span className="w-16" />
        </div>

        {/* 프로필 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-panel/60 border border-edge rounded-2xl p-4 mb-4 flex items-center gap-3"
        >
          <div
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-void font-extrabold text-xl shrink-0"
          >
            {user.nickname[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-snow font-bold text-base truncate">
                {user.nickname}
              </p>
              <button
                onClick={() => setShowTierInfo(true)}
                aria-label={t("me.tier.info")}
                className="shrink-0 active:scale-95 transition"
              >
                <TierBadge totalScore={rankInfo?.totalScore ?? 0} size="sm" />
              </button>
            </div>
            <p className="text-haze text-xs truncate">@{user.username}</p>
          </div>
          <button
            onClick={() => setShowEditNickname(true)}
            className="shrink-0 text-xs text-neon-cyan border border-neon-cyan/50 rounded-lg px-3 py-1.5 hover:bg-neon-cyan/10 active:scale-95 transition"
            aria-label={t("me.profile.edit")}
          >
            {t("me.profile.edit")}
          </button>
        </motion.div>

        {/* 코인 */}
        <div className="mb-5">
          <Section title={t("coins.label")}>
            <div className="bg-panel/60 border border-edge rounded-2xl p-4">
              <CoinBalance />
            </div>
          </Section>
        </div>

        {/* 티어 진행도 */}
        <div className="mb-5">
          <Section title={t("me.tier.section")}>
            <TierProgress totalScore={rankInfo?.totalScore ?? 0} />
          </Section>
        </div>

        {/* 전적 */}
        <div className="mb-5">
          <Section title={t("me.section.stats")}>
            {rankLoading && !rankInfo ? (
              <div className="bg-void border border-edge rounded-xl py-8 flex items-center justify-center gap-2 text-haze text-sm">
                <Spinner size="sm" />
                {t("common.loading")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatCell
                  label={t("me.stats.rank")}
                  value={rankInfo?.rank != null ? `#${rankInfo.rank}` : "-"}
                />
                <StatCell
                  label={t("me.stats.totalScore")}
                  value={(rankInfo?.totalScore ?? 0).toLocaleString()}
                />
                <StatCell
                  label={t("me.stats.games")}
                  value={t("unit.games", { n: rankInfo?.gamesPlayed ?? 0 })}
                />
                <StatCell
                  label={t("me.stats.bestScore")}
                  value={t("unit.points", { n: rankInfo?.bestScore ?? 0 })}
                />
                <div className="col-span-2">
                  <StatCell
                    label={t("me.stats.bestCombo")}
                    value={bestComboLabel}
                  />
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* 친구 */}
        <div className="mb-5">
          <Section title={t("me.section.friends")}>
            <FriendsPanel />
          </Section>
        </div>

        {/* 설정 */}
        <div className="mb-5">
          <Section title={t("me.section.settings")}>
            <div className="bg-panel/60 border border-edge rounded-2xl divide-y divide-edge">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-snow text-sm">
                  {t("me.settings.language")}
                </span>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-snow text-sm">
                  {t("me.settings.sound")}
                </span>
                <MuteButton />
              </div>
            </div>
          </Section>
        </div>

        {/* 계정 */}
        <div className="mb-2">
          <Section title={t("me.section.account")}>
            <div className="bg-panel/60 border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-haze hover:text-snow hover:bg-edge text-sm transition-colors"
              >
                {t("me.account.logout")}
              </button>
              <Link
                href="/privacy"
                className="block px-4 py-3 text-haze hover:text-snow hover:bg-edge text-sm transition-colors"
              >
                {t("me.account.privacy")}
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-left px-4 py-3 text-red-400/80 hover:text-red-400 hover:bg-edge text-sm transition-colors"
              >
                {t("me.account.delete")}
              </button>
            </div>
          </Section>
        </div>
      </div>

      <AnimatePresence>
        {showTierInfo && (
          <TierInfoModal
            totalScore={rankInfo?.totalScore ?? 0}
            onClose={() => setShowTierInfo(false)}
          />
        )}
      </AnimatePresence>
      <EditNicknameModal
        open={showEditNickname}
        onClose={() => setShowEditNickname(false)}
      />
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default MyPage;
