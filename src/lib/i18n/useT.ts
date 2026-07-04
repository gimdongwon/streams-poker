"use client";

import { useCallback } from "react";
import { useI18nStore } from "@/stores/i18nStore";
import { DEFAULT_LOCALE } from "./locales";
import { messages } from "./messages";

export type TParams = Record<string, string | number>;

const interpolate = (template: string, params?: TParams): string => {
  if (!params) return template;
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
};

/** 현재 언어로 키를 번역한다. 누락 키는 기본 언어 → 키 자체로 폴백. */
export const useT = () => {
  const locale = useI18nStore((s) => s.locale);
  return useCallback(
    (key: string, params?: TParams): string => {
      const dict = messages[locale] ?? messages[DEFAULT_LOCALE];
      const value = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
      return interpolate(value, params);
    },
    [locale]
  );
};
