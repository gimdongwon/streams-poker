"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type LogoProps = {
  size?: "sm" | "lg";
  showSubtitle?: boolean;
  className?: string;
};

export const Logo = ({
  size = "lg",
  showSubtitle = false,
  className = "",
}: LogoProps) => {
  const textSize = size === "lg" ? "text-3xl" : "text-lg";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${className}`}
    >
      <Link
        href="/lobby"
        className={`${textSize} font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 hover:opacity-80 transition-opacity`}
        aria-label="홈으로 이동"
        tabIndex={0}
      >
        STREAMS POKER
      </Link>
      {showSubtitle && (
        <p className="text-gray-400 mt-2">전략 카드 배치 게임</p>
      )}
    </motion.div>
  );
};
