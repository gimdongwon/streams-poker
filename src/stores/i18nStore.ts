import { create } from "zustand";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";

const STORAGE_KEY = "tens-locale";

// 저장된 선택 → 브라우저 언어 순으로 초기 언어를 감지한다.
const detectLocale = (): Locale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // ignore
  }
  const nav =
    typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  if (nav.startsWith("ko")) return "ko";
  // 한국어가 아니면 영어로.
  return "en";
};

const persistLocale = (locale: Locale): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore persistence failures
  }
};

type I18nStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useI18nStore = create<I18nStore>((set) => ({
  locale: detectLocale(),
  setLocale: (locale: Locale) => {
    persistLocale(locale);
    set({ locale });
  },
}));
