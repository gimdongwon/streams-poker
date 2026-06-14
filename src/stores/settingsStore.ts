import { create } from "zustand";

const STORAGE_KEY = "tens-muted";

const readInitialMuted = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const persistMuted = (muted: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // ignore persistence failures (private mode, etc.)
  }
};

type SettingsStore = {
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (b: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  muted: readInitialMuted(),

  toggleMuted: () => {
    const next = !get().muted;
    persistMuted(next);
    set({ muted: next });
  },

  setMuted: (b: boolean) => {
    persistMuted(b);
    set({ muted: b });
  },
}));
