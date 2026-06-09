"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";

type AuthFormProps = {
  mode: "login" | "signup";
};

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const { login, signup } = useAuthStore();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    let result: string | null;

    if (mode === "login") {
      result = await login(username, password);
    } else {
      result = await signup(username, nickname, password);
    }

    setIsLoading(false);

    if (result) {
      setError(result);
      return;
    }

    router.push("/lobby");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleNavigate = () => {
    router.push(mode === "login" ? "/register" : "/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div className="bg-panel/60 backdrop-blur-sm rounded-2xl border border-edge p-6">
        <h2 className="text-lg font-bold text-snow text-center mb-5">
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="auth-username"
              className="block text-haze text-[10px] tracking-[2px] uppercase mb-1 font-medium"
            >
              아이디
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="3~20자"
              maxLength={20}
              className="w-full px-4 py-2.5 bg-void border border-edge rounded-xl text-snow text-sm placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors"
            />
          </div>

          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label
                  htmlFor="auth-nickname"
                  className="block text-haze text-[10px] tracking-[2px] uppercase mb-1 font-medium"
                >
                  닉네임
                </label>
                <input
                  id="auth-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="게임에서 표시될 이름 (1~12자)"
                  maxLength={12}
                  className="w-full px-4 py-2.5 bg-void border border-edge rounded-xl text-snow text-sm placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-haze text-[10px] tracking-[2px] uppercase mb-1 font-medium"
            >
              비밀번호
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="4자 이상"
              className="w-full px-4 py-2.5 bg-void border border-edge rounded-xl text-snow text-sm placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors"
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-xs mt-3 text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
          className="w-full mt-4 py-3 text-void font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label={mode === "login" ? "로그인" : "가입하기"}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
              처리 중...
            </span>
          ) : mode === "login" ? (
            "로그인"
          ) : (
            "가입하기"
          )}
        </button>

        <button
          onClick={handleNavigate}
          className="w-full mt-3 text-haze hover:text-snow text-xs transition-colors py-1"
          aria-label={mode === "login" ? "회원가입으로 이동" : "로그인으로 이동"}
          tabIndex={0}
        >
          {mode === "login"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </motion.div>
  );
};
