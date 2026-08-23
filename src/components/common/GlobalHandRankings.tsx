"use client";

import { usePathname } from "next/navigation";
import { HandRankingsButton } from "@/components/game/HandRankingsModal";

// 개인정보/공지 아이콘은 로비 좌측 버튼으로 옮겨져 여기선 족보만 남긴다.
// 로비는 좌측 컬럼에 족보 버튼도 있어 플로팅 아이콘 전체를 숨긴다.
const HIDDEN_PATHS = ["/login", "/register", "/lobby"];

export const GlobalHandRankings = () => {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return <HandRankingsButton />;
};
