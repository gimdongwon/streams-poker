"use client";

import { usePathname } from "next/navigation";
import { HandRankingsButton } from "@/components/game/HandRankingsModal";

const HIDDEN_PATHS = ["/login", "/register"];

export const GlobalHandRankings = () => {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return <HandRankingsButton />;
};
