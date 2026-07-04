"use client";

import { useI18nStore } from "@/stores/i18nStore";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";

type LanguageToggleProps = {
  className?: string;
};

/** 한국어/English 세그먼트 토글. */
export const LanguageToggle = ({ className = "" }: LanguageToggleProps) => {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-edge bg-void/60 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
            locale === l
              ? "bg-neon-cyan/20 text-neon-cyan"
              : "text-haze hover:text-snow"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
};
