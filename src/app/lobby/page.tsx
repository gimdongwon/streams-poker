"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Logo } from "@/components/common/Logo";
import { connectSocket } from "@/lib/socket";

type Mode = "select" | "multi_create" | "multi_join";

const LobbyPage = () => {
  const router = useRouter();
  const { setNickname, createRoom, initSocketListeners, roomCode: storeRoomCode } = useRoomStore();
  const { user, isLoggedIn, logout, hasHydrated } = useAuthStore();

  const [mode, setMode] = useState<Mode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (showLeaderboard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLeaderboard]);

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
    if (storeRoomCode) {
      router.push(`/room/${storeRoomCode}`);
    }
  }, [storeRoomCode, router]);

  const handleSinglePlay = () => {
    router.push("/game/single");
  };

  const handleCreateRoom = () => {
    const nickname = user?.nickname ?? "Player";
    initSocketListeners();
    const socket = connectSocket();

    if (socket.connected) {
      createRoom(nickname);
    } else {
      socket.once("connect", () => createRoom(nickname));
    }
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setError("방 코드를 입력해주세요");
      return;
    }
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!hasHydrated || !isLoggedIn || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex flex-col items-center justify-center p-3 overflow-auto">
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
              <Leaderboard highlightNickname={user.nickname} />
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full mt-2 py-2 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-colors bg-gray-800 border border-gray-700 hover:bg-gray-700"
                aria-label="닫기"
                tabIndex={0}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상단: 유저 정보 */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl border border-gray-700 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                {user.nickname[0]}
              </div>
              <div>
                <p className="text-white font-medium text-xs">{user.nickname}</p>
                <p className="text-gray-500 text-[10px]">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-300 text-[10px] transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-700/50 border border-gray-700"
              aria-label="로그아웃"
              tabIndex={0}
            >
              로그아웃
            </button>
          </motion.div>
        </div>
      </div>

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
      <div className="flex flex-col landscape:flex-row gap-4 landscape:gap-6 w-full max-w-2xl landscape:items-start items-center">
        {/* 좌측: 규칙 + 리더보드 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="landscape:flex-1 landscape:min-w-0 w-full max-w-sm landscape:max-w-none order-2 landscape:order-1"
        >
          <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50 mb-3">
            <h3 className="text-gray-300 font-bold text-xs mb-2">게임 규칙</h3>
            <ul className="text-gray-500 text-[10px] space-y-1">
              <li>• 10라운드 동안 매 라운드 카드 1장이 공개됩니다</li>
              <li>• 10초 안에 10개 슬롯 중 하나에 배치하세요</li>
              <li>• 슬롯 순서가 스트레이트 판정에 영향을 줍니다</li>
              <li>• 조커는 와일드카드로 최적 조합에 자동 배정됩니다</li>
              <li>• 가장 높은 총점의 플레이어가 승리합니다</li>
            </ul>
          </div>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all border border-gray-700 hover:border-gray-600"
            aria-label="리더보드 보기"
            tabIndex={0}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>🏆</span>
              <span>리더보드 보기</span>
            </div>
          </button>
        </motion.div>

        {/* 우측: 모드 선택 버튼 */}
        <div className="w-full max-w-sm landscape:w-72 landscape:shrink-0 order-1 landscape:order-2">
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
                  className="w-full py-5 px-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                  aria-label="싱글 모드로 시작"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🎮</span>
                    <div className="text-left">
                      <div className="text-base">싱글 모드</div>
                      <div className="text-xs font-normal opacity-80">
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
                  className="w-full py-5 px-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                  aria-label="멀티플레이 모드"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div className="text-left">
                      <div className="text-base">멀티플레이</div>
                      <div className="text-xs font-normal opacity-80">
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
                  className="w-full py-5 px-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-500/20"
                  aria-label="방 만들기"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🏠</span>
                    <div className="text-left">
                      <div className="text-base">방 만들기</div>
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
                  className="w-full py-5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                  aria-label="방 참여하기"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🚪</span>
                    <div className="text-left">
                      <div className="text-base">방 참여하기</div>
                      <div className="text-xs font-normal opacity-80">
                        코드를 입력하여 참여
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMode("select");
                    setError("");
                  }}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors py-1"
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
                    className="block text-gray-400 text-xs mb-1.5 font-medium"
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-xl font-mono tracking-[0.3em] placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors uppercase"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length < 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all active:scale-95"
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
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors py-1"
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
  );
};

export default LobbyPage;
