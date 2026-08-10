import Link from "next/link";

// 가이드 공통 레이아웃: 고정 헤더 + 본문 폭 제한.
// SEO 콘텐츠(한국어) — 검색 유입용 정적 페이지들.
export default function GuideLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="scroll-screen bg-void text-snow safe-pad-x">
      <header className="sticky top-0 z-10 bg-void/95 backdrop-blur-sm border-b border-edge">
        <div className="mx-auto w-full max-w-2xl px-5 py-3 flex items-center justify-between">
          <Link href="/" className="text-haze hover:text-snow text-xs">
            ← TENTENS
          </Link>
          <Link
            href="/login"
            className="text-void text-xs font-extrabold px-3 py-1.5 rounded-lg"
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
          >
            무료로 플레이
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl px-5 py-8">{children}</div>
    </main>
  );
}
