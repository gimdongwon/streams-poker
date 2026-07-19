"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/stores/authStore";
import { isSocialEnabled } from "@/lib/socialAuth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

// 멀티 입구 승격 모달. 게스트가 실시간 대전에 진입할 때 처음으로 계정을 요구한다.
// 같은 users.id 를 유지한 채 승격하므로 싱글에서 쌓은 전적/코인이 그대로 이어진다.
// UX 가이드: "회원가입"이 아니라 "실시간 대전 시작하기" 프레이밍.
export function UpgradeAccountModal({
  open,
  onClose,
  onUpgraded,
}: {
  open: boolean;
  onClose: () => void;
  onUpgraded: () => void;
}) {
  const router = useRouter();
  const upgrade = useAuthStore((s) => s.upgrade);
  const socialUpgrade = useAuthStore((s) => s.socialUpgrade);
  const social = isSocialEnabled();
  const platform = Capacitor.getPlatform();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const handleSocial = async (provider: "apple" | "google") => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const err = await socialUpgrade(provider);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    onUpgraded();
  };

  const handleUpgrade = async () => {
    if (busy) return;
    setError(null);
    if (!username.trim() || !nickname.trim() || !password) {
      setError("모든 항목을 입력해주세요");
      return;
    }
    setBusy(true);
    const err = await upgrade(username.trim(), nickname.trim(), password);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    onUpgraded();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="실시간 대전 시작하기"
        >
          <motion.div
            className="w-full max-w-sm bg-panel border border-edge rounded-2xl p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-snow font-bold text-base mb-1">실시간 대전 시작하기</h2>
            <p className="text-haze text-xs leading-relaxed mb-4">
              계정을 만들면 지금까지의 기록이 안전하게 저장되고, 다른 사람과 실시간으로 대전할 수 있어요.
            </p>

            {social && (
              <div className="mb-3 flex flex-col gap-2">
                {platform === "ios" && (
                  <button
                    onClick={() => handleSocial("apple")}
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Apple로 계속하기
                  </button>
                )}
                {platform === "android" && (
                  <button
                    onClick={() => handleSocial("google")}
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <GoogleIcon />
                    Google로 계속하기
                  </button>
                )}
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-edge" />
                  <span className="text-haze text-[10px]">또는 아이디로</span>
                  <div className="flex-1 h-px bg-edge" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 (3~20자)"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-void border border-edge rounded-xl px-3 py-2.5 text-snow text-sm placeholder:text-haze/60 focus:outline-none focus:border-haze"
                disabled={busy}
                aria-label="아이디"
              />
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 (1~12자)"
                className="w-full bg-void border border-edge rounded-xl px-3 py-2.5 text-snow text-sm placeholder:text-haze/60 focus:outline-none focus:border-haze"
                disabled={busy}
                aria-label="닉네임"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpgrade()}
                placeholder="비밀번호 (4자 이상)"
                className="w-full bg-void border border-edge rounded-xl px-3 py-2.5 text-snow text-sm placeholder:text-haze/60 focus:outline-none focus:border-haze"
                disabled={busy}
                aria-label="비밀번호"
              />
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <button
              onClick={handleUpgrade}
              disabled={busy}
              className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-magenta text-void font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "처리 중…" : "시작하기"}
            </button>

            <button
              onClick={() => router.push("/login")}
              disabled={busy}
              className="w-full mt-2 py-2 text-haze hover:text-snow text-xs transition-colors disabled:opacity-50"
            >
              이미 계정이 있나요? 로그인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
