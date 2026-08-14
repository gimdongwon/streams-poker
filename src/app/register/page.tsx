"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullScreenLoading } from "@/components/common/FullScreenLoading";

// 게스트 중심 모델 전환으로 회원가입 페이지 폐지 — 로그인으로 리다이렉트.
// (기존 북마크/링크 호환을 위해 라우트는 유지)
const RegisterPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return <FullScreenLoading />;
};

export default RegisterPage;
