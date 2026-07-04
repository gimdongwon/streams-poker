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
  setCoins: (coins: number) => void;
  refreshCoins: () => Promise<boolean>; // 반환: 오늘 일일보상 수령 가능 여부
  claimDaily: () => Promise<{ claimed: boolean; coins: number } | null>;
  updateNickname: (nickname: string) => Promise<string | null>;
  deleteAccount: (password: string) => Promise<string | null>;
  clearForcedOut: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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

      setCoins: (coins) => {
        const { user } = get();
        if (user) set({ user: { ...user, coins } });
      },

      refreshCoins: async () => {
        const { user } = get();
        if (!user) return false;
        try {
          const res = await fetch(`/api/coins?userId=${user.id}`);
          if (!res.ok) return false;
          const data: { coins: number; canClaimDaily: boolean } =
            await res.json();
          set({ user: { ...user, coins: data.coins } });
          return data.canClaimDaily;
        } catch {
          return false;
        }
      },

      claimDaily: async () => {
        const { user } = get();
        if (!user) return null;
        try {
          const res = await fetch("/api/coins/daily", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          if (!res.ok) return null;
          const data: { claimed: boolean; coins: number } = await res.json();
          set({ user: { ...user, coins: data.coins } });
          return data;
        } catch {
          return null;
        }
      },

      updateNickname: async (nickname) => {
        const { user } = get();
        if (!user) return "로그인이 필요합니다";
        const trimmed = nickname.trim();
        if (trimmed === user.nickname) return null;
        try {
          const res = await fetch("/api/account/nickname", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, nickname: trimmed }),
          });

          const data = await res.json();

          if (!res.ok) return data.error ?? "닉네임 변경에 실패했습니다";

          set({ user: data.user });
          return null;
        } catch {
          return "서버 연결에 실패했습니다";
        }
      },

      deleteAccount: async (password) => {
        const { user } = get();
        if (!user) return "로그인이 필요합니다";
        try {
          const res = await fetch("/api/account/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, password }),
          });

          const data = await res.json();

          if (!res.ok) return data.error ?? "계정 삭제에 실패했습니다";

          set({ user: null, isLoggedIn: false, forcedOut: false });
          return null;
        } catch {
          return "서버 연결에 실패했습니다";
        }
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
