"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { FullScreenLoading } from "@/components/common/FullScreenLoading";
import { Board } from "@/components/game/Board";
import { evaluateSlots } from "@/lib/poker/evaluator";
import { comboKey } from "@/lib/i18n/combo";
import { useT } from "@/lib/i18n/useT";
import { captureReferral } from "@/lib/referral";
import type { Slot, SlotIndex } from "@/types/game";
import type { Suit, Rank } from "@/types/card";

// 스토어 배지용 아이콘 (단색 — 버튼 텍스트 색상 따라감)
const AppleLogoIcon = () => (
  <svg viewBox="0 0 384 512" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M3.6 1.8c-.37.4-.6.95-.6 1.62v17.16c0 .67.23 1.23.6 1.62L13.8 12 3.6 1.8zm11.4 8.99l2.87-2.87-11.3-6.5c-.53-.3-1.03-.36-1.45-.2L15 10.79zm0 2.42L5.12 22.36c.42.16.92.1 1.45-.2l11.3-6.5L15 13.21zm4.13-4.13l2.14 1.23c1.17.67 1.17 1.71 0 2.38l-2.14 1.23L16.2 12l2.93-2.92z" />
  </svg>
);

const APP_STORE_URL = "https://apps.apple.com/app/id6792527133";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=kr.tentens.app";
const PLAY_STORE_READY = true;

// 히어로 보드: 실제 게임 Board 컴포넌트 + 실제 점수 계산기로 채점한 예시 한 판.
const SUIT_OF: Record<string, Suit> = { "♠": "spade", "♥": "heart", "♦": "diamond", "♣": "club" };
const HERO_SLOTS: Slot[] = ["6♣", "7♥", "8♣", "9♦", "10♣", "K♠", "K♥", "3♦", "Q♣", "Q♥"].map(
  (c, i) => ({
    index: i as SlotIndex,
    card: { type: "normal", suit: SUIT_OF[c.slice(-1)], rank: c.slice(0, -1) as Rank, id: `hero-${c}` },
  })
);
const HERO_COMBOS = evaluateSlots(HERO_SLOTS);
const HERO_TOTAL = HERO_COMBOS.reduce((sum, c) => sum + c.score, 0);

// 랜딩 공통 버튼 — 주 액션 하나(시안 단색), 나머지는 외곽선.
const BTN_PRIMARY =
  "inline-flex items-center justify-center h-12 px-7 rounded-xl bg-neon-cyan text-void text-base font-extrabold whitespace-nowrap hover:bg-snow active:translate-y-px transition-colors";
const BTN_SECONDARY =
  "inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-edge text-snow text-sm font-bold whitespace-nowrap hover:border-haze active:translate-y-px transition-colors";

// 루트: 웹 방문자에겐 마케팅 랜딩, 네이티브 앱에선 게임으로 바로 리다이렉트.
const LandingPage = () => {
  const t = useT();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuthStore();

  // 초대 링크(?ref=)로 온 방문 기억 → 가입 시 보상 청구
  useEffect(() => {
    captureReferral();
  }, []);

  // 네이티브 앱(원격 URL 래퍼)은 랜딩을 건너뛰고 바로 게임으로.
  const isNative = Capacitor.isNativePlatform();
  useEffect(() => {
    if (!isNative || !hasHydrated) return;
    router.replace(isLoggedIn ? "/lobby" : "/login");
  }, [isNative, hasHydrated, isLoggedIn, router]);

  if (isNative) return <FullScreenLoading />;

  // 웹 CTA: /login 은 로그인 상태면 /lobby 로 보내주므로 양쪽 모두 안전한 진입점.
  const playHref = "/login";

  const features = ["daily", "multi", "strategy", "rank"] as const;

  const storeBadges = (
    <div className="flex flex-wrap items-center gap-2">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
        <AppleLogoIcon /> {t("landing.cta.appstore")}
      </a>
      {PLAY_STORE_READY ? (
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
          <PlayStoreIcon /> {t("landing.cta.googleplayReady")}
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-edge text-haze text-sm font-bold">
          <PlayStoreIcon /> {t("landing.cta.googleplay")}
        </span>
      )}
    </div>
  );

  // 구조화 데이터 (검색 리치 스니펫용): 게임 정보 + FAQ
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: "TENTENS",
        url: "https://www.tentens.kr",
        image: "https://www.tentens.kr/og.png",
        description: t("landing.hero.sub"),
        genre: ["Card Game", "Strategy", "Puzzle"],
        playMode: ["SinglePlayer", "MultiPlayer"],
        gamePlatform: ["Web Browser", "iOS", "Android"],
        applicationCategory: "GameApplication",
        operatingSystem: "Web, iOS, Android",
        inLanguage: ["ko", "en"],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
        },
        publisher: { "@type": "Person", name: "Dongwon Kim" },
      },
      {
        "@type": "FAQPage",
        mainEntity: ([1, 2, 3, 4] as const).map((n) => ({
          "@type": "Question",
          name: t(`landing.faq.${n}.q`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`landing.faq.${n}.a`),
          },
        })),
      },
    ],
  };

  const heroBoard = (size: "sm" | "md") => (
    <Board
      slots={HERO_SLOTS}
      isActive={false}
      onPlace={() => {}}
      combinations={HERO_COMBOS}
      size={size}
      showHeader={false}
      showComboLabels={false}
    />
  );

  return (
    <main className="landing scroll-screen bg-void text-snow safe-pad-x">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 헤더 */}
      {/* z-30: 히어로 보드의 슬롯 번호 배지(z-20)보다 위 */}
      <header className="sticky top-0 z-30 bg-void/90 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-5xl px-5 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href={playHref}
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-lg bg-neon-cyan text-void text-xs font-extrabold whitespace-nowrap hover:bg-snow transition-colors"
            >
              {t("landing.cta.play")}
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로: 왼쪽 카피 + 오른쪽 실제 게임 보드 */}
      <section className="mx-auto w-full max-w-5xl px-5 pt-10 pb-20 sm:pt-16 sm:pb-28 grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center">
        <div className="min-w-0">
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight break-words">
            {t("landing.hero.title1")}
            <br />
            {t("landing.hero.title2")}
          </h1>
          <p className="text-haze text-base sm:text-lg leading-relaxed max-w-md mt-6">
            {t("landing.hero.sub")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={playHref} className={BTN_PRIMARY}>
              {t("landing.cta.play")}
            </Link>
            <span className="text-haze text-sm">{t("landing.cta.playSub")}</span>
          </div>
          <div className="mt-5">{storeBadges}</div>
        </div>

        <figure className="min-w-0 justify-self-center md:justify-self-end">
          {/* 실제 Board 컴포넌트 — 장식이므로 포커스·스크린리더에서 제외 */}
          <div inert aria-hidden="true">
            <div className="sm:hidden">{heroBoard("sm")}</div>
            <div className="hidden sm:block">{heroBoard("md")}</div>
          </div>
          <figcaption className="mt-2 text-haze text-sm tabular-nums">
            {HERO_COMBOS.map((c) => `${t(comboKey(c.type))} ${c.score}`).join(" + ")} ={" "}
            <span className="text-snow font-bold">{HERO_TOTAL}</span>
          </figcaption>
        </figure>
      </section>

      {/* 이용 방법 — 히어로 보드를 바로 설명 */}
      <section className="bg-panel/50 border-y border-edge">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-10">
            {t("landing.how.title")}
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
                <span className="text-neon-cyan text-2xl font-black leading-none tabular-nums">{n}</span>
                <div>
                  <h3 className="text-snow font-bold text-base mb-1.5">{t(`landing.how.${n}.title`)}</h3>
                  <p className="text-haze text-sm leading-relaxed">{t(`landing.how.${n}.desc`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 기능 */}
      <section className="mx-auto w-full max-w-5xl px-5 pt-24 pb-16">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-xl mb-12">
          {t("landing.features.title")}
        </h2>
        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {features.map((id) => (
            <div key={id} className="border-t border-edge pt-5">
              <h3 className="text-snow font-bold text-lg mb-2">{t(`landing.feat.${id}.title`)}</h3>
              <p className="text-haze text-[15px] leading-relaxed max-w-md">{t(`landing.feat.${id}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 스크린샷: 실제 플레이 화면 크게, 나머지 둘은 나란히 */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-24 grid gap-6 sm:grid-cols-2">
        {(
          [
            { src: "/landing/gameplay.webp", key: "gameplay", w: 1074, h: 422, wide: true },
            { src: "/landing/multi.webp", key: "multi", w: 1200, h: 675, wide: false },
            { src: "/landing/ranking.webp", key: "ranking", w: 1200, h: 675, wide: false },
          ] as const
        ).map((s) => (
          <figure key={s.key} className={`min-w-0 ${s.wide ? "sm:col-span-2" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={t(`landing.shots.${s.key}`)}
              width={s.w}
              height={s.h}
              loading={s.wide ? "eager" : "lazy"}
              className="w-full h-auto block rounded-xl border border-edge"
            />
            <figcaption className="mt-3 text-haze text-sm">{t(`landing.shots.${s.key}`)}</figcaption>
          </figure>
        ))}
      </section>

      {/* 전략 가이드 */}
      <section className="mx-auto w-full max-w-5xl px-5 py-20 border-t border-edge">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-10">
          {t("landing.guide.title")}
        </h2>
        <div className="grid gap-x-12 sm:grid-cols-2">
          {(["scoring", "strategy"] as const).map((g) => (
            <Link
              key={g}
              href={`/guide/${g}`}
              className="group block border-t border-edge py-6"
            >
              <h3 className="text-snow font-bold text-lg mb-2 group-hover:text-neon-cyan transition-colors">
                {t(`landing.guide.${g}.title`)}
              </h3>
              <p className="text-haze text-[15px] leading-relaxed mb-4">
                {t(`landing.guide.${g}.desc`)}
              </p>
              <span className="text-snow text-sm font-bold underline underline-offset-4 decoration-edge group-hover:decoration-neon-cyan">
                {t("landing.guide.read")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ — 제목 왼쪽, 질문 오른쪽 */}
      <section className="mx-auto w-full max-w-5xl px-5 py-20 border-t border-edge grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("landing.faq.title")}</h2>
        <div className="divide-y divide-edge border-y border-edge">
          {([1, 2, 3, 4] as const).map((n) => (
            <details key={n} className="group py-5">
              <summary className="text-snow text-base font-bold cursor-pointer list-none flex items-center justify-between gap-4">
                {t(`landing.faq.${n}.q`)}
                <span className="text-haze text-xl leading-none group-open:rotate-45 transition-transform" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="text-haze text-[15px] leading-relaxed mt-3 max-w-prose">
                {t(`landing.faq.${n}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="bg-panel/50 border-t border-edge">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{t("landing.bottom.title")}</h2>
            <p className="text-haze text-base">{t("landing.bottom.sub")}</p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <Link href={playHref} className={BTN_PRIMARY}>
              {t("landing.cta.play")}
            </Link>
            {storeBadges}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-edge">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-haze text-sm">
          <span>© 2026 TENTENS</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-snow transition-colors">
              {t("landing.footer.privacy")}
            </Link>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-snow transition-colors"
            >
              App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-snow transition-colors"
            >
              Google Play
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
