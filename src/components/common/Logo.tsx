"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type LogoProps = {
  size?: "sm" | "lg";
  showSubtitle?: boolean;
  className?: string;
};

const GRADIENT = "linear-gradient(135deg, #2de2e6, #ff2e97)";

export const Logo = ({
  size = "lg",
  showSubtitle = false,
  className = "",
}: LogoProps) => {
  const isLg = size === "lg";
  const tile = isLg ? "w-11 h-11 rounded-xl text-2xl" : "w-7 h-7 rounded-lg text-base";
  const word = isLg ? "text-3xl" : "text-lg";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center ${className}`}
    >
      <Link
        href="/lobby"
        className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="홈으로 이동"
        tabIndex={0}
      >
        <span
          className={`${tile} grid place-items-center font-extrabold leading-none`}
          style={{ background: GRADIENT, color: "#0b0e14" }}
        >
          X
        </span>
        <span className={`${word} font-extrabold tracking-tight text-snow`}>
          TENS
        </span>
      </Link>
      {showSubtitle && (
        <p className="text-haze mt-2">전략 카드 배치 게임</p>
      )}
    </motion.div>
  );
};
