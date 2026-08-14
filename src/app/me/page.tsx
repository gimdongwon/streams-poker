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
import { FullScreenLoading } from "@/components/common/FullScreenLoading";
import { shareResult } from "@/lib/share";
import { referralLink } from "@/lib/referral";
import { TierInfoModal } from "@/components/common/TierInfoModal";
import { TierProgress } from "@/components/common/TierProgress";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { MuteButton } from "@/components/common/MuteButton";
import { Spinner } from "@/components/common/Spinner";
import { CoinBalance } from "@/components/common/CoinBalance";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { EditNicknameModal } from "@/components/auth/EditNicknameModal";
import { Capacitor } from "@capacitor/core";
import { isSocialEnabled } from "@/lib/socialAuth";
import { AppleIcon } from "@/components/auth/AppleIcon";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { UpgradeAccountModal } from "@/components/auth/UpgradeAccountModal";
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
  const { user, isLoggedIn, hasHydrated, logout, socialUpgrade } = useAuthStore();

  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [showEditNickname, setShowEditNickname] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

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

  // 초대 링크 공유 (시스템 공유 시트 → 폴백 클립보드)
  const handleShareReferral = async () => {
    if (!user) return;
    await shareResult(t("referral.shareText"), referralLink(user.id));
  };

  // 기록 백업: 소셜 계정 연동 (같은 users.id 유지 — 코인·티어·친구 그대로)
  const social = isSocialEnabled();
  const platform = Capacitor.getPlatform();
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleBackup = async (provider: "apple" | "google") => {
    if (backingUp) return;
    setBackupError(null);
    setBackingUp(true);
    const err = await socialUpgrade(provider);
    if (err) setBackupError(err);
    setBackingUp(false);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!hasHydrated || !isLoggedIn || !user) return <FullScreenLoading />;

  const bestComboLabel = (() => {
    if (!rankInfo?.bestCombo) return t("me.stats.none");
    const type = comboTypeFromKoName(rankInfo.bestCombo);
    return type ? t(comboKey(type)) : rankInfo.bestCombo;
  })();

  return (
    <div className="scroll-screen bg-void flex flex-col items-center pb-16 safe-pad-x">
      <div className="w-full max-w-lg">
        {/* 헤더 (스크롤해도 상단 고정) */}
        <div className="sticky top-0 z-20 flex items-center justify-between mb-4 py-2.5 bg-void/90 backdrop-blur-sm border-b border-edge/60">
          <Link
            href="/lobby"
            className="text-haze hover:text-snow text-sm transition-colors px-2 py-1 rounded-lg hover:bg-edge"
          >
            ← {t("me.back")}
          </Link>
          <h1 className="text-snow font-bold text-sm">{t("me.title")}</h1>
          <button
            onClick={handleLogout}
            className="text-haze hover:text-snow text-sm transition-colors px-2 py-1 rounded-lg hover:bg-edge"
          >
            {t("me.account.logout")}
          </button>
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

        {/* 기록 백업 (게스트 전용): 폰 변경/재설치에도 코인·티어·친구 보존 */}
        {user.is_guest && social && (
          <div className="mb-5">
            <div className="bg-panel border border-yellow-400/40 rounded-xl p-4">
              <p className="text-snow text-sm font-bold flex items-center gap-2">
                <span className="text-lg">🔒</span> {t("backup.title")}
              </p>
              <p className="text-haze text-xs leading-relaxed mt-1 mb-3">
                {t("backup.desc")}
              </p>
              {platform === "ios" && (
                <button
                  onClick={() => handleBackup("apple")}
                  disabled={backingUp}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {backingUp ? <Spinner size="sm" colorClassName="border-black" /> : <AppleIcon />}
                  {t("auth.social.apple")}
                </button>
              )}
              {platform === "android" && (
                <button
                  onClick={() => handleBackup("google")}
                  disabled={backingUp}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {backingUp ? <Spinner size="sm" colorClassName="border-black" /> : <GoogleIcon />}
                  {t("auth.social.google")}
                </button>
              )}
              {backupError && (
                <p className="text-red-400 text-xs mt-2">{backupError}</p>
              )}
            </div>
          </div>
        )}
        {!user.is_guest && (
          <div className="mb-5">
            <div className="bg-panel/60 border border-edge rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-haze">
              <span>✅</span> {t("backup.done")}
            </div>
          </div>
        )}

        {/* 친구 초대 */}
        {(
          <div className="mb-5">
            <button
              onClick={handleShareReferral}
              className="w-full bg-panel border border-neon-magenta/40 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-edge transition-colors text-left"
              aria-label={t("referral.cta")}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-snow">
                <span className="text-lg">🎁</span>
                <span>
                  {t("referral.cta")}
                  <span className="block text-[11px] font-normal text-haze mt-0.5">
                    {t("referral.desc")}
                  </span>
                </span>
              </span>
              <span className="text-haze text-xs shrink-0">→</span>
            </button>
          </div>
        )}

        {/* 업적 */}
        <div className="mb-5">
          <Link
            href="/me/achievements"
            className="w-full bg-panel border border-yellow-400/40 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-edge transition-colors"
            aria-label={t("ach.view")}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-snow">
              <span className="text-lg">🏅</span>
              {t("ach.view")}
            </span>
            <span className="text-haze text-xs">→</span>
          </Link>
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
              {user.is_guest && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full text-left px-4 py-3 text-neon-cyan hover:bg-edge text-sm font-medium transition-colors"
                >
                  로그인 / 계정 만들기
                </button>
              )}
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
      <UpgradeAccountModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgraded={() => setShowUpgrade(false)}
      />
    </div>
  );
};

export default MyPage;
