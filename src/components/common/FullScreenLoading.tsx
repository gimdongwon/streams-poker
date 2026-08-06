"use client";

import { Spinner } from "@/components/common/Spinner";

// 페이지 전환/세션 확인 중 빈 화면 대신 보여주는 전체 화면 로딩.
// (원격 웹 방식이라 페이지 전환에 네트워크 지연이 있을 수 있어 필수)
export const FullScreenLoading = () => (
  <div className="fixed inset-0 bg-void flex items-center justify-center">
    <Spinner size="md" />
  </div>
);
