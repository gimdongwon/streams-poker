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
  // 세션이 없으면 익명 게스트 세션을 만든다(앱 부팅 시 호출).
  ensureSession: () => Promise<void>;
  // 게스트 → 정식 계정 승격 (같은 id 유지, 전적 승계).
  upgrade: (
    username: string,
    nickname: string,
    password: string
  ) => Promise<string | null>;
  // 게스트 → 네이티브 소셜(Apple/Google) 승격. 같은 id 유지 or 기존 계정 로그인(충돌).
  socialUpgrade: (provider: "apple" | "google") => Promise<string | null>;
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

      ensureSession: async () => {
        if (get().user) return; // 이미 세션 있음(게스트/정식 무관)
        try {
          const res = await fetch("/api/auth/guest", { method: "POST" });
          const data = await res.json();
          if (!res.ok) return;
          set({ user: data.user, isLoggedIn: true, forcedOut: false });
        } catch {
          // 오프라인 등 — 무시 (다음 진입 시 재시도)
        }
      },

      upgrade: async (username, nickname, password) => {
        const { user } = get();
        if (!user) return "세션이 없습니다";
        try {
          const res = await fetch("/api/auth/upgrade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, username, nickname, password }),
          });

          const data = await res.json();

          if (!res.ok) return data.error ?? "승격에 실패했습니다";

          set({ user: data.user, isLoggedIn: true, forcedOut: false });
          return null;
        } catch {
          return "서버 연결에 실패했습니다";
        }
      },

      socialUpgrade: async (provider) => {
        const { user } = get();
        try {
          const { socialLogin } = await import("@/lib/socialAuth");
          const { idToken, name } = await socialLogin(provider);
          if (!idToken) return "소셜 로그인 토큰을 받지 못했습니다";
          const res = await fetch("/api/auth/social", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, idToken, currentUserId: user?.id, name }),
          });
          const data = await res.json();
          if (!res.ok) return data.error ?? "소셜 로그인에 실패했습니다";
          set({ user: data.user, isLoggedIn: true, forcedOut: false });
          return null;
        } catch {
          return "소셜 로그인이 취소되었거나 실패했습니다";
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
