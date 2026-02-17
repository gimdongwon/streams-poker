"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";

type Mode = "select" | "multi_create" | "multi_join";

const LobbyPage = () => {
  const router = useRouter();
  const { nickname, setNickname, createRoom, joinRoom } = useRoomStore();
  const [mode, setMode] = useState<Mode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [error, setError] = useState("");

  const handleNicknameConfirm = () => {
    if (!nicknameInput.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }
    setNickname(nicknameInput.trim());
    setError("");
  };

  const isNicknameSet = nickname.trim().length > 0;

  const handleSinglePlay = () => {
    if (!isNicknameSet) {
      setError("먼저 닉네임을 입력해주세요");
      return;
    }
    router.push("/game/solo");
  };

  const handleCreateRoom = () => {
    if (!isNicknameSet) {
      setError("먼저 닉네임을 입력해주세요");
      return;
    }
    const code = createRoom();
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = () => {
    if (!isNicknameSet) {
      setError("먼저 닉네임을 입력해주세요");
      return;
    }
    if (!joinCode.trim()) {
      setError("방 코드를 입력해주세요");
      return;
    }
    const success = joinRoom(joinCode.trim().toUpperCase());
    if (success) {
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    } else {
      setError("방이 가득 찼거나 존재하지 않습니다");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2">
          STREAMS POKER
        </h1>
        <p className="text-gray-400">전략 카드 배치 게임</p>
      </motion.div>

      {/* 닉네임 입력 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm mb-8"
      >
        <label
          htmlFor="nickname"
          className="block text-gray-400 text-sm mb-2 font-medium"
        >
          닉네임
        </label>
        <div className="flex gap-2">
          <input
            id="nickname"
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNicknameConfirm();
            }}
            placeholder="닉네임을 입력하세요"
            maxLength={12}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={handleNicknameConfirm}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              isNicknameSet
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
            aria-label="닉네임 확인"
          >
            {isNicknameSet ? "✓" : "확인"}
          </button>
        </div>
        {isNicknameSet && (
          <p className="text-green-400 text-xs mt-1">
            안녕하세요, {nickname}님!
          </p>
        )}
      </motion.div>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 모드 선택 */}
      <AnimatePresence mode="wait">
        {mode === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <button
              onClick={handleSinglePlay}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
              aria-label="싱글 모드로 시작"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🎮</span>
                <div className="text-left">
                  <div>싱글 모드</div>
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
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20"
              aria-label="멀티플레이 모드"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">👥</span>
                <div className="text-left">
                  <div>멀티플레이</div>
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
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <button
              onClick={handleCreateRoom}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/20"
              aria-label="방 만들기"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🏠</span>
                <div className="text-left">
                  <div>방 만들기</div>
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
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20"
              aria-label="방 참여하기"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🚪</span>
                <div className="text-left">
                  <div>방 참여하기</div>
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
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
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
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <div>
              <label
                htmlFor="room-code"
                className="block text-gray-400 text-sm mb-2 font-medium"
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
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-2xl font-mono tracking-[0.3em] placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors uppercase"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={joinCode.length < 6}
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
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
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
              aria-label="뒤로가기"
            >
              ← 뒤로가기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게임 규칙 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 bg-gray-800/40 rounded-xl p-5 max-w-sm w-full border border-gray-700/50"
      >
        <h3 className="text-gray-300 font-bold text-sm mb-3">게임 규칙</h3>
        <ul className="text-gray-500 text-xs space-y-1.5">
          <li>• 10라운드 동안 매 라운드 카드 1장이 공개됩니다</li>
          <li>• 10초 안에 10개 슬롯 중 하나에 배치하세요</li>
          <li>• 슬롯 순서가 스트레이트 판정에 영향을 줍니다</li>
          <li>• 조커는 와일드카드로 최적 조합에 자동 배정됩니다</li>
          <li>• 가장 높은 총점의 플레이어가 승리합니다</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default LobbyPage;
