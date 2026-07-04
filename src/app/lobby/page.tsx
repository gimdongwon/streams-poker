"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Logo } from "@/components/common/Logo";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { TierBadge } from "@/components/common/TierBadge";
import { TierInfoModal } from "@/components/common/TierInfoModal";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { Spinner } from "@/components/common/Spinner";
import type { UserRankInfo } from "@/types/leaderboard";
import type { FriendRequest } from "@/lib/friends";

type Mode = "select" | "multi_create" | "multi_join" | "multi_browse";

const LobbyPage = () => {
  const router = useRouter();
  const { setNickname, createRoom, initSocketListeners, roomCode: storeRoomCode, status: roomStatus, isConnected, resetRoom, requestRoomList, roomList, isCreatingRoom, isLoadingRoomList } = useRoomStore();
  const { user, isLoggedIn, logout, hasHydrated } = useAuthStore();

  const [mode, setMode] = useState<Mode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);

  useEffect(() => {
    if (showLeaderboard || showFriends || showTierInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLeaderboard, showFriends, showTierInfo]);

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
  }, [user?.id, showFriends]);

  useEffect(() => {
    if (hasHydrated && !isLoggedIn) {
      router.replace("/login");
    }
  }, [hasHydrated, isLoggedIn, router]);

  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
    }
  }, [user, setNickname]);

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
    createRoom(nickname);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setError("방 코드를 입력해주세요");
      return;
    }
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleBrowseRooms = () => {
    setMode("multi_browse");
    setError("");
    requestRoomList();
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!hasHydrated || !isLoggedIn || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-void flex flex-col items-center p-3 pb-16 overflow-auto">
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
              aria-label="리더보드 닫기"
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
                aria-label="닫기"
                tabIndex={0}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 친구 모달 */}
      <AnimatePresence>
        {showFriends && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 overscroll-contain"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowFriends(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowFriends(false);
              }}
              role="button"
              tabIndex={0}
              aria-label="친구 닫기"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md max-h-[90dvh] overflow-y-auto"
            >
              <FriendsPanel userId={user.id} />
              <button
                onClick={() => setShowFriends(false)}
                className="w-full mt-2 py-2 text-haze hover:text-snow text-xs font-medium rounded-xl transition-colors bg-panel border border-edge hover:bg-edge"
                aria-label="닫기"
                tabIndex={0}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 티어 안내 모달 */}
      <AnimatePresence>
        {showTierInfo && rankInfo && (
          <TierInfoModal
            totalScore={rankInfo.totalScore}
            onClose={() => setShowTierInfo(false)}
          />
        )}
      </AnimatePresence>

      {/* 계정 삭제 확인 모달 */}
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* 상단 헤더: 로고 + 내 랭킹/점수 + 유저 정보 */}
      <div className="w-full max-w-4xl mb-4 flex items-center gap-3">
        {/* 좌측: 로고 */}
        <div className="flex-1 flex justify-start min-w-0">
          <Logo size="sm" />
        </div>

        {/* 가운데: 내 랭킹 & 점수 */}
        {!rankInfo && rankLoading && (
          <div
            className="flex items-center gap-4 bg-panel/60 rounded-2xl border border-edge px-5 py-2 shrink-0 animate-pulse"
            aria-label="랭킹 정보 불러오는 중"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-2 w-6 rounded bg-edge" />
              <div className="h-5 w-12 rounded-full bg-edge" />
            </div>
            {[0, 1, 2].map((i) => (
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
            className="flex items-center gap-4 bg-panel/60 rounded-2xl border border-edge px-5 py-2 shrink-0"
          >
            <button
              onClick={() => setShowTierInfo(true)}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
              aria-label="티어 안내 보기"
            >
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                티어
              </p>
              <TierBadge totalScore={rankInfo.totalScore} size="md" />
            </button>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                내 랭킹
              </p>
              <p className="text-snow font-bold text-base leading-tight">
                {rankInfo.rank != null ? `#${rankInfo.rank}` : "-"}
              </p>
            </div>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                누적 점수
              </p>
              <p className="text-neon-cyan font-bold text-base leading-tight">
                {rankInfo.totalScore.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-7 bg-edge" />
            <div className="text-center">
              <p className="text-haze text-[9px] tracking-[2px] uppercase font-medium">
                판수
              </p>
              <p className="text-snow font-bold text-base leading-tight">
                {rankInfo.gamesPlayed}
              </p>
            </div>
          </motion.div>
        )}

        {/* 우측: 유저 정보 */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex items-center justify-end gap-3 min-w-0"
        >
          {/* 친구 버튼 (받은 요청 수 배지) */}
          <button
            onClick={() => setShowFriends(true)}
            className="relative flex items-center gap-2 bg-panel/60 rounded-xl border border-edge px-3 py-2 hover:bg-edge transition-colors shrink-0"
            aria-label="친구 열기"
            tabIndex={0}
          >
            <span className="text-base leading-none">👥</span>
            <span className="text-snow font-medium text-xs">친구</span>
            {incomingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-neon-magenta text-void text-[10px] font-bold">
                {incomingCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 bg-panel/60 rounded-xl border border-edge px-3 py-2 hover:bg-edge transition-colors"
              aria-label="계정 메뉴 열기"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
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
                <p className="text-haze text-[10px] truncate">@{user.username}</p>
              </div>
              <motion.span
                animate={{ rotate: showUserMenu ? 180 : 0 }}
                className="text-haze text-[10px] ml-0.5 shrink-0"
              >
                ▾
              </motion.span>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  {/* 바깥 클릭 시 닫기 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                    role="button"
                    tabIndex={-1}
                    aria-label="메뉴 닫기"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-full z-20 bg-panel border border-edge rounded-xl overflow-hidden shadow-lg"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-haze hover:text-snow hover:bg-edge text-xs transition-colors"
                      aria-label="로그아웃"
                      tabIndex={0}
                    >
                      로그아웃
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full text-left px-3 py-2.5 text-red-400/80 hover:text-red-400 hover:bg-edge text-xs transition-colors border-t border-edge"
                      aria-label="계정 삭제"
                      tabIndex={0}
                    >
                      계정 삭제
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* 가운데 영역: 에러 + 메인 콘텐츠 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
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
      <div className="flex flex-col landscape:flex-row gap-5 landscape:gap-8 w-full max-w-4xl landscape:items-start items-center justify-center">
        {/* 좌측: 규칙 + 리더보드 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="landscape:flex-1 landscape:min-w-0 w-full max-w-md landscape:max-w-none order-2 landscape:order-1"
        >
          <div className="bg-panel/40 rounded-2xl p-4 border border-edge mb-3">
            <h3 className="text-haze text-xs tracking-[2px] uppercase font-bold mb-2.5">게임 규칙</h3>
            <ul className="text-haze text-xs space-y-1.5">
              <li>• 10라운드 동안 매 라운드 카드 1장이 공개됩니다</li>
              <li>• 10초 안에 10개 슬롯 중 하나에 배치하세요</li>
              <li>• 슬롯 순서가 스트레이트 판정에 영향을 줍니다</li>
              <li>• 조커는 와일드카드로 최적 조합에 자동 배정됩니다</li>
              <li>• 가장 높은 총점의 플레이어가 승리합니다</li>
            </ul>
          </div>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 px-3 bg-panel hover:bg-edge text-snow text-sm font-medium rounded-2xl transition-all border border-edge active:scale-95"
            aria-label="리더보드 보기"
            tabIndex={0}
          >
            <div className="flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>리더보드 보기</span>
            </div>
          </button>
        </motion.div>

        {/* 우측: 모드 선택 버튼 */}
        <div className="w-full max-w-md landscape:w-80 landscape:shrink-0 order-1 landscape:order-2">
          <AnimatePresence mode="wait">
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3"
              >
                <button
                  onClick={handleSinglePlay}
                  className="w-full py-4 px-5 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10"
                  aria-label="싱글 모드로 시작"
                >
                  <div className="flex items-center justify-start gap-3">
                    <span className="text-2xl text-neon-cyan w-10 text-center shrink-0">🎮</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">싱글 모드</div>
                      <div className="text-xs font-normal text-haze">
                        혼자서 최고 점수에 도전
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("multi_create");
                    setError("");
                  }}
                  className="w-full py-4 px-5 bg-panel border border-neon-magenta/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-magenta/10"
                  aria-label="멀티플레이 모드"
                >
                  <div className="flex items-center justify-start gap-3">
                    <span className="text-2xl text-neon-magenta w-10 text-center shrink-0">👥</span>
                    <div className="text-left">
                      <div className="text-base text-neon-magenta">멀티플레이</div>
                      <div className="text-xs font-normal text-haze">
                        친구와 함께 대결 (최대 10명)
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )}

            {mode === "multi_create" && (
              <motion.div
                key="multi"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3"
              >
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
                  className="w-full py-4 px-5 text-void font-bold rounded-2xl transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="방 만들기"
                >
                  <div className="flex items-center justify-start gap-3">
                    <span className="text-2xl w-10 flex items-center justify-center shrink-0">
                      {isCreatingRoom ? (
                        <Spinner size="md" colorClassName="border-void" />
                      ) : (
                        "🏠"
                      )}
                    </span>
                    <div className="text-left">
                      <div className="text-base">
                        {isCreatingRoom ? "방 만드는 중..." : "방 만들기"}
                      </div>
                      <div className="text-xs font-normal opacity-80">
                        새로운 방을 생성합니다
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("multi_join");
                    setError("");
                  }}
                  className="w-full py-4 px-5 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10"
                  aria-label="방 참여하기"
                >
                  <div className="flex items-center justify-start gap-3">
                    <span className="text-2xl text-neon-cyan w-10 text-center shrink-0">🚪</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">방 참여하기</div>
                      <div className="text-xs font-normal text-haze">
                        코드를 입력하여 참여
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleBrowseRooms}
                  className="w-full py-4 px-5 bg-panel border border-neon-cyan/60 text-snow font-bold rounded-2xl transition-all active:scale-95 hover:bg-neon-cyan/10"
                  aria-label="방 찾기"
                >
                  <div className="flex items-center justify-start gap-3">
                    <span className="text-2xl text-neon-cyan w-10 text-center shrink-0">🔍</span>
                    <div className="text-left">
                      <div className="text-base text-neon-cyan">방 찾기</div>
                      <div className="text-xs font-normal text-haze">
                        열려 있는 방 목록에서 참여
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("select");
                    setError("");
                  }}
                  className="text-haze hover:text-snow text-sm transition-colors py-1"
                  aria-label="뒤로가기"
                >
                  ← 뒤로가기
                </button>
              </motion.div>
            )}

            {mode === "multi_browse" && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-haze text-[10px] tracking-[2px] uppercase font-medium">
                    열려 있는 방
                  </span>
                  <button
                    onClick={() => requestRoomList()}
                    className="text-haze hover:text-neon-cyan text-xs transition-colors px-2 py-1 rounded-lg active:scale-95"
                    aria-label="새로고침"
                  >
                    ↻ 새로고침
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[50vh] landscape:max-h-[44vh] overflow-y-auto">
                  {isLoadingRoomList && roomList.length === 0 ? (
                    <div className="bg-panel/40 border border-edge rounded-xl py-10 flex items-center justify-center gap-2 text-haze text-sm">
                      <Spinner size="sm" />
                      방 목록을 불러오는 중...
                    </div>
                  ) : roomList.length === 0 ? (
                    <div className="bg-panel/40 border border-edge rounded-xl py-10 text-center text-haze text-sm">
                      열려 있는 방이 없어요
                    </div>
                  ) : (
                    roomList.map((room) => (
                      <button
                        key={room.code}
                        onClick={() => router.push(`/room/${room.code}`)}
                        className="w-full bg-panel border border-edge rounded-xl px-4 py-3 transition-all active:scale-95 hover:bg-edge hover:border-neon-cyan/60 text-left"
                        aria-label={`${room.hostNickname}님의 방 참여`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-snow font-medium text-sm truncate">
                              {room.hostNickname}님의 방
                            </div>
                            <div className="text-haze text-[10px] font-mono tracking-wider truncate">
                              {room.code}
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

                <button
                  onClick={() => {
                    setMode("multi_create");
                    setError("");
                  }}
                  className="text-haze hover:text-snow text-sm transition-colors py-1"
                  aria-label="뒤로가기"
                >
                  ← 뒤로가기
                </button>
              </motion.div>
            )}

            {mode === "multi_join" && (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor="room-code"
                    className="block text-haze text-[10px] tracking-[2px] uppercase mb-1.5 font-medium"
                  >
                    방 코드 입력
                  </label>
                  <input
                    id="room-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoinRoom();
                    }}
                    placeholder="6자리 코드 입력"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-void border border-edge rounded-xl text-snow text-center text-xl font-mono tracking-[0.3em] placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors uppercase"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length < 6}
                  style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
                  className="w-full py-3 px-4 text-void text-sm font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="참여하기"
                >
                  참여하기
                </button>

                <button
                  onClick={() => {
                    setMode("multi_create");
                    setError("");
                    setJoinCode("");
                  }}
                  className="text-haze hover:text-snow text-sm transition-colors py-1"
                  aria-label="뒤로가기"
                >
                  ← 뒤로가기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LobbyPage;
