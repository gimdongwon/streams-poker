"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { useGameStore } from "@/stores/gameStore";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Logo } from "@/components/common/Logo";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { TierBadge } from "@/components/common/TierBadge";
import { TierProgress } from "@/components/common/TierProgress";
import { DailyRewardButton } from "@/components/common/DailyRewardButton";
import { Spinner } from "@/components/common/Spinner";
import { registerPushForUser } from "@/lib/native";
// import { showRewardedAd } from "@/lib/ads"; // 임시 광고 테스트 버튼용 (아래 주석 참고)
import { useT } from "@/lib/i18n/useT";
import { UpgradeAccountModal } from "@/components/auth/UpgradeAccountModal";
import type { UserRankInfo } from "@/types/leaderboard";
import type { FriendRequest } from "@/lib/friends";

type Mode = "select" | "multi_create" | "multi_join" | "multi_browse";

const BET_TIERS = [0, 100, 500, 1000, 5000, 10000] as const;

const LobbyPage = () => {
  const t = useT();
  const router = useRouter();
  const { setNickname, createRoom, initSocketListeners, roomCode: storeRoomCode, status: roomStatus, isConnected, resetRoom, requestRoomList, roomList, isCreatingRoom, isLoadingRoomList } = useRoomStore();
  const { user, isLoggedIn, hasHydrated } = useAuthStore();

  const [mode, setMode] = useState<Mode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [incomingCount, setIncomingCount] = useState(0);
  const [selectedBet, setSelectedBet] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // 멀티 진입: 게스트면 승격 모달을, 정식 계정이면 멀티 화면으로.
  const enterMultiplayer = () => {
    setError("");
    if (user?.is_guest) {
      setShowUpgrade(true);
    } else {
      setMode("multi_create");
    }
  };

  // 로비 진입 시 진행 중이던 게임 상태를 정리한다.
  // (뒤로가기 등으로 handleBackToLobby 를 거치지 않고 로비에 온 경우,
  //  전역 게임 타이머가 계속 tick 하며 카운트다운 사운드가 나던 문제 방지)
  useEffect(() => {
    useGameStore.getState().resetGame();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showLeaderboard ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLeaderboard]);

  // 받은 친구 요청 수 (배지용). 실패 시 무시.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetchWithTimeout(
          `/api/friends/requests?userId=${user.id}`
        );
        if (!res.ok) return;
        const data: FriendRequest[] = await res.json();
        if (!cancelled) setIncomingCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // 친구 요청 수 조회 실패 시 무시
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // 입구 로그인 벽 없음: 세션은 랜딩(/)의 "임시로 시작하기" 버튼이 게스트로 확보한다.
  // 익명 우선 전략 — 멀티 입구에서만 정식 계정을 요구한다.

  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
    }
  }, [user, setNickname]);

  // 네이티브 앱에서 푸시 알림 등록 (친구 요청 알림용). 브라우저에서는 no-op.
  useEffect(() => {
    if (user?.id) registerPushForUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchRank = async () => {
      if (!cancelled) setRankLoading(true);
      try {
        const res = await fetchWithTimeout(`/api/leaderboard/rank?userId=${user.id}`);
        if (!res.ok) return;
        const data: UserRankInfo = await res.json();
        if (!cancelled) setRankInfo(data);
      } catch {
        // 랭킹 정보 조회 실패 시 무시
      } finally {
        if (!cancelled) setRankLoading(false);
      }
    };
    fetchRank();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (storeRoomCode && roomStatus === "waiting" && isConnected) {
      router.push(`/room/${storeRoomCode}`);
    } else if (storeRoomCode && !isConnected) {
      resetRoom();
    }
  }, [storeRoomCode, roomStatus, isConnected, router, resetRoom]);

  const handleSinglePlay = () => {
    router.push("/game/single");
  };

  const handleCreateRoom = () => {
    if (isCreatingRoom) return;
    const nickname = user?.nickname ?? "Player";
    initSocketListeners();
    // 소켓 연결 + 방 생성 + 로딩 플래그는 store.createRoom 이 처리한다.
    createRoom(nickname, selectedBet);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setError(t("lobby.join.error.empty"));
      return;
    }
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleBrowseRooms = () => {
    setMode("multi_browse");
    setError("");
    requestRoomList();
  };

  const handleBack = () => {
    setError("");
    if (mode === "multi_join" || mode === "multi_browse") {
      setMode("multi_create");
      setJoinCode("");
    } else {
      setMode("select");
    }
  };

  if (!hasHydrated || !isLoggedIn || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col items-center p-3 pb-16 overflow-auto safe-pad-x">
      {/* 멀티 입구 승격 모달 (게스트 → 정식 계정) */}
      <UpgradeAccountModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgraded={() => {
          setShowUpgrade(false);
          setMode("multi_create");
        }}
      />

      {/* 리더보드 모달 */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 overscroll-contain"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowLeaderboard(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowLeaderboard(false);
              }}
              role="button"
              tabIndex={0}
              aria-label={t("lobby.leaderboard.close")}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md"
            >
              <Leaderboard highlightNickname={user.nickname} highlightUserId={user.id} />
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full mt-2 py-2 text-haze hover:text-snow text-xs font-medium rounded-xl transition-colors bg-panel border border-edge hover:bg-edge"
                aria-label={t("lobby.modal.close")}
                tabIndex={0}
              >
                {t("lobby.modal.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상단 헤더: 로고 + 내 랭킹/점수 + 유저 정보 */}
      <div className="w-full max-w-4xl mb-4 landscape:mb-2 [@media(max-height:430px)]:mb-1 flex items-center gap-2 min-w-0">
        {/* 좌측: 로고 */}
        <div className="flex-1 flex justify-start min-w-0">
          <Logo size="sm" />
        </div>

        {/* 가운데: 내 랭킹 & 점수 */}
        {!rankInfo && rankLoading && (
          <div
            className="flex items-center gap-3 bg-panel/60 rounded-2xl border border-edge px-4 py-2 shrink-0 animate-pulse"
            aria-label={t("lobby.rank.loading")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-2 w-6 rounded bg-edge" />
              <div className="h-5 w-12 rounded-full bg-edge" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-px h-7 bg-edge" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-2 w-8 rounded bg-edge" />
                  <div className="h-3.5 w-8 rounded bg-edge" />
                </div>
              </div>
            ))}
          </div>
        )}

        {rankInfo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-panel/60 rounded-2xl border border-edge px-4 py-2 [@media(max-height:430px)]:py-1 shrink-0"
          >
            <button
              onClick={() => router.push("/me")}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
              aria-label={t("lobby.account.myPage")}
            >
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                {t("lobby.rank.tier")}
              </p>
              <TierBadge totalScore={rankInfo.totalScore} size="md" />
              <TierProgress
                totalScore={rankInfo.totalScore}
                bare
                className="w-14 mt-0.5 [@media(max-height:430px)]:hidden"
              />
            </button>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                {t("lobby.rank.myRank")}
              </p>
              <p className="text-snow font-bold text-base leading-tight">
                {rankInfo.rank != null ? `#${rankInfo.rank}` : "-"}
              </p>
            </div>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                {t("lobby.rank.totalScore")}
              </p>
              <p className="text-neon-cyan font-bold text-base leading-tight">
                {rankInfo.totalScore.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                {t("lobby.rank.gamesPlayed")}
              </p>
              <p className="text-snow font-bold text-base leading-tight">
                {rankInfo.gamesPlayed}
              </p>
            </div>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                {t("coins.label")}
              </p>
              <p className="text-yellow-400 font-bold text-base leading-tight whitespace-nowrap">
                🪙 {(user.coins ?? 0).toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* 우측: 마이페이지 진입 (아바타) */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex items-center justify-end min-w-0"
        >
          <button
            onClick={() => router.push("/me")}
            className="relative flex items-center gap-2 bg-panel/60 rounded-xl border border-edge px-3 py-2 hover:bg-edge transition-colors min-w-0 max-w-[45vw]"
            aria-label={t("lobby.account.myPage")}
            tabIndex={0}
          >
            <div
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-void font-bold text-xs shrink-0"
            >
              {user.nickname[0]}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-snow font-medium text-xs truncate">{user.nickname}</p>
              <p className="text-neon-cyan/80 text-[10px] truncate">{t("lobby.account.myPage")}</p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-haze shrink-0 ml-0.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {incomingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-neon-magenta text-void text-[10px] font-bold">
                {incomingCount}
              </span>
            )}
          </button>
        </motion.div>
      </div>

      {/* 가운데 영역: 에러 + 메인 콘텐츠 (상단 정렬 — 위 여백 제거, 하단 고정 아이콘과 겹침 방지) */}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs mb-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠: 좌(게임규칙/리더보드) + 우(모드 버튼) */}
      <div className="flex flex-col landscape:flex-row gap-5 landscape:gap-6 w-full max-w-4xl landscape:items-stretch items-center justify-center landscape:flex-1 landscape:min-h-0 landscape:max-h-[360px]">
        {/* 좌측: 규칙 + 리더보드 (모드 선택 화면에서만 노출 → 멀티 진입 시 스크롤 감소) */}
        {mode === "select" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="landscape:flex-1 landscape:min-w-0 w-full max-w-md landscape:max-w-none order-2 landscape:order-1 landscape:flex landscape:flex-col landscape:justify-center"
        >
          <div className="bg-panel/40 rounded-2xl p-4 [@media(max-height:430px)]:p-2.5 border border-edge mb-3 [@media(max-height:430px)]:mb-2">
            <h3 className="text-haze text-xs tracking-[2px] uppercase font-bold mb-2.5 [@media(max-height:430px)]:mb-1.5">{t("lobby.rules.title")}</h3>
            <ul className="text-haze text-xs space-y-1.5 [@media(max-height:430px)]:space-y-1">
              <li>{t("lobby.rules.item1")}</li>
              <li>{t("lobby.rules.item2")}</li>
              <li>{t("lobby.rules.item3")}</li>
              <li>{t("lobby.rules.item4")}</li>
              <li>{t("lobby.rules.item5")}</li>
            </ul>
          </div>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 [@media(max-height:430px)]:py-2 px-3 bg-panel hover:bg-edge text-snow text-sm font-medium rounded-2xl transition-all border border-edge active:scale-95"
            aria-label={t("lobby.leaderboard.view")}
            tabIndex={0}
          >
            <div className="flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>{t("lobby.leaderboard.view")}</span>
            </div>
          </button>
        </motion.div>
        )}

        {/* 우측: 모드 선택 버튼 */}
        <div
          className={`order-1 landscape:order-2 flex flex-col ${
            mode === "select"
              ? "w-full max-w-md landscape:w-80 landscape:shrink-0"
              : "w-full max-w-2xl"
          }`}
        >
          {mode !== "select" && (
            <button
              onClick={handleBack}
              className="mb-3 inline-flex items-center gap-1 text-haze hover:text-snow text-sm transition-colors"
              aria-label={t("lobby.common.back")}
            >
              {t("lobby.common.back")}
            </button>
          )}
          <AnimatePresence mode="wait">
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col gap-3 landscape:flex-1"
              >
                <button
                  onClick={handleSinglePlay}
                  className="w-full py-3 px-4 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10 landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center"
                  aria-label={t("lobby.mode.single.aria")}
                >
                  <div className="flex items-center justify-start gap-2.5">
                    <span className="text-xl text-neon-cyan w-10 text-center shrink-0">🎮</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">{t("lobby.mode.single.title")}</div>
                      <div className="text-xs font-normal text-haze">
                        {t("lobby.mode.single.desc")}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={enterMultiplayer}
                  className="w-full py-3 px-4 bg-panel border border-neon-magenta/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-magenta/10 landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center"
                  aria-label={t("lobby.mode.multi.aria")}
                >
                  <div className="flex items-center justify-start gap-2.5">
                    <span className="text-xl text-neon-magenta w-10 text-center shrink-0">👥</span>
                    <div className="text-left">
                      <div className="text-base text-neon-magenta">{t("lobby.mode.multi.title")}</div>
                      <div className="text-xs font-normal text-haze">
                        {t("lobby.mode.multi.desc")}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )}

            {mode === "multi_create" && (
              <motion.div
                key="multi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col landscape:flex-row gap-3 landscape:items-stretch landscape:flex-1 landscape:min-h-0"
              >
                {/* 참가비 선택 (좌측, 6) */}
                <div className="bg-panel/40 border border-edge rounded-2xl p-4 w-full landscape:flex-[6] landscape:min-w-0 landscape:flex landscape:flex-col landscape:justify-center">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-haze text-[11px] tracking-[2px] uppercase font-bold">
                      {t("coins.bet.label")}
                    </span>
                    <span className="text-neon-cyan text-sm font-bold">
                      🪙 {(user.coins ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 landscape:flex-1 landscape:auto-rows-fr">
                    {BET_TIERS.map((b) => {
                      const afford = b === 0 || (user.coins ?? 0) >= b;
                      const active = selectedBet === b;
                      return (
                        <button
                          key={b}
                          onClick={() => setSelectedBet(b)}
                          disabled={!afford}
                          className={`py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center ${
                            active
                              ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/60"
                              : "bg-void border border-edge text-haze hover:text-snow disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {b === 0 ? t("coins.bet.free") : b.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 버튼들 (우측, 4) */}
                <div className="flex flex-col gap-3 w-full landscape:flex-[4] min-w-0">
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
                  className="w-full py-3 px-4 text-void font-bold rounded-2xl transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center"
                  aria-label={t("lobby.create.aria")}
                >
                  <div className="flex items-center justify-start gap-2.5">
                    <span className="text-xl w-10 flex items-center justify-center shrink-0">
                      {isCreatingRoom ? (
                        <Spinner size="md" colorClassName="border-void" />
                      ) : (
                        "🏠"
                      )}
                    </span>
                    <div className="text-left">
                      <div className="text-base">
                        {isCreatingRoom ? t("lobby.create.creating") : t("lobby.create.title")}
                      </div>
                      <div className="text-xs font-normal opacity-80">
                        {selectedBet > 0
                          ? t("coins.bet.room", { n: selectedBet.toLocaleString() })
                          : t("coins.bet.freeRoom")}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("multi_join");
                    setError("");
                  }}
                  className="w-full py-3 px-4 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10 landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center"
                  aria-label={t("lobby.join.aria")}
                >
                  <div className="flex items-center justify-start gap-2.5">
                    <span className="text-xl text-neon-cyan w-10 text-center shrink-0">🚪</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">{t("lobby.join.title")}</div>
                      <div className="text-xs font-normal text-haze">
                        {t("lobby.join.desc")}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleBrowseRooms}
                  className="w-full py-3 px-4 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10 landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center"
                  aria-label={t("lobby.browse.aria")}
                >
                  <div className="flex items-center justify-start gap-2.5">
                    <span className="text-xl text-neon-cyan w-10 text-center shrink-0">🔍</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">{t("lobby.browse.title")}</div>
                      <div className="text-xs font-normal text-haze">
                        {t("lobby.browse.desc")}
                      </div>
                    </div>
                  </div>
                </button>
                </div>
              </motion.div>
            )}

            {mode === "multi_browse" && (
              <motion.div
                key="browse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-haze text-[10px] tracking-[2px] uppercase font-medium">
                    {t("lobby.browse.openRooms")}
                  </span>
                  <button
                    onClick={() => requestRoomList()}
                    className="text-haze hover:text-neon-cyan text-xs transition-colors px-2 py-1 rounded-lg active:scale-95"
                    aria-label={t("lobby.browse.refreshAria")}
                  >
                    {t("lobby.browse.refresh")}
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[50vh] landscape:max-h-[44vh] overflow-y-auto">
                  {isLoadingRoomList && roomList.length === 0 ? (
                    <div className="bg-panel/40 border border-edge rounded-xl py-10 flex items-center justify-center gap-2 text-haze text-sm">
                      <Spinner size="sm" />
                      {t("lobby.browse.loading")}
                    </div>
                  ) : roomList.length === 0 ? (
                    <div className="bg-panel/40 border border-edge rounded-xl py-10 text-center text-haze text-sm">
                      {t("lobby.browse.empty")}
                    </div>
                  ) : (
                    roomList.map((room) => (
                      <button
                        key={room.code}
                        onClick={() => router.push(`/room/${room.code}`)}
                        className="w-full bg-panel border border-edge rounded-xl px-4 py-3 transition-all active:scale-95 hover:bg-edge hover:border-neon-cyan/60 text-left"
                        aria-label={t("lobby.browse.roomJoinAria", { host: room.hostNickname })}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-snow font-medium text-sm truncate">
                              {t("lobby.browse.roomTitle", { host: room.hostNickname })}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-haze text-[10px] font-mono tracking-wider truncate">
                                {room.code}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  room.bet > 0
                                    ? "text-neon-cyan bg-neon-cyan/10"
                                    : "text-haze bg-edge"
                                }`}
                              >
                                {room.bet > 0
                                  ? `🪙 ${room.bet.toLocaleString()}`
                                  : t("coins.bet.free")}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-neon-cyan font-bold text-sm">
                              {room.playerCount}
                            </span>
                            <span className="text-haze text-xs">/{room.maxPlayers}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {mode === "multi_join" && (
              <motion.div
                key="join"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor="room-code"
                    className="block text-haze text-[10px] tracking-[2px] uppercase mb-1.5 font-medium"
                  >
                    {t("lobby.join.label")}
                  </label>
                  <input
                    id="room-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoinRoom();
                    }}
                    placeholder={t("lobby.join.placeholder")}
                    maxLength={6}
                    className="w-full px-4 py-3 bg-void border border-edge rounded-xl text-snow text-center text-xl font-mono tracking-[0.3em] placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors uppercase"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length < 6}
                  style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
                  className="w-full py-3 px-4 text-void text-sm font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t("lobby.join.submitAria")}
                >
                  {t("lobby.join.submit")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* 우측 하단 고정: 일일 보상 받기 (추후 AdMob 리워드 광고 연결) */}
      <div
        className="fixed z-40 flex items-center gap-2"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {/* 임시: AdMob 리워드 광고 테스트 버튼 (필요 시 위 import와 함께 주석 해제)
        <button
          onClick={async () => {
            const outcome = await showRewardedAd({ test: true });
            window.alert(`광고 결과: ${outcome}`);
          }}
          className="py-2.5 px-4 rounded-2xl text-xs font-extrabold bg-panel border border-edge text-snow active:scale-95 transition-all shadow-lg shadow-black/40"
        >
          🎬 광고 테스트
        </button>
        */}
        {/* 일일 보상은 정식 계정만 (게스트 어뷰징 방지) */}
        {!user.is_guest && <DailyRewardButton />}
      </div>
    </div>
  );
};

export default LobbyPage;
