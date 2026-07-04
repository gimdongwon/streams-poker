"use client";

import { useT } from "@/lib/i18n/useT";

type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  size?: SpinnerSize;
  /** 테두리 색 유틸 (예: "border-neon-cyan", "border-void") */
  colorClassName?: string;
  className?: string;
};

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-[3px]",
};

/** 공용 로딩 스피너. 회전하는 원형 인디케이터. */
export const Spinner = ({
  size = "sm",
  colorClassName = "border-neon-cyan",
  className = "",
}: SpinnerProps) => {
  const t = useT();
  return (
    <span
      role="status"
      aria-label={t("common.loading")}
      className={`inline-block shrink-0 rounded-full border-t-transparent animate-spin ${SIZE_MAP[size]} ${colorClassName} ${className}`}
    />
  );
};
