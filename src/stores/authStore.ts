import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

type AuthStore = {
  user: User | null;
  isLoggedIn: boolean;
  forcedOut: boolean;
  hasHydrated: boolean;

  login: (username: string, password: string) => Promise<string | null>;
  signup: (
    username: string,
    nickname: string,
    password: string
  ) => Promise<string | null>;
  logout: () => void;
  clearForcedOut: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      forcedOut: false,
      hasHydrated: false,

      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),

      login: async (username, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          const data = await res.json();

          if (!res.ok) return data.error ?? "로그인에 실패했습니다";

          set({ user: data.user, isLoggedIn: true, forcedOut: false });
          return null;
        } catch {
          return "서버 연결에 실패했습니다";
        }
      },

      signup: async (username, nickname, password) => {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, nickname, password }),
          });

          const data = await res.json();

          if (!res.ok) return data.error ?? "회원가입에 실패했습니다";

          set({ user: data.user, isLoggedIn: true, forcedOut: false });
          return null;
        } catch {
          return "서버 연결에 실패했습니다";
        }
      },

      logout: () => {
        set({ user: null, isLoggedIn: false, forcedOut: false });
      },

      clearForcedOut: () => set({ forcedOut: false }),
    }),
    {
      name: "streams-poker-auth",
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
