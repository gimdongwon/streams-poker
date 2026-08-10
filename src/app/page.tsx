"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/common/Logo";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { FullScreenLoading } from "@/components/common/FullScreenLoading";
import { useT } from "@/lib/i18n/useT";

const APP_STORE_URL = "https://apps.apple.com/app/id6792527133";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=kr.tentens.app";
// 안드로이드 프로덕션 공개 후 true 로
const PLAY_STORE_READY = false;

// 루트: 웹 방문자에겐 마케팅 랜딩, 네이티브 앱에선 게임으로 바로 리다이렉트.
const LandingPage = () => {
  const t = useT();
  const router = useRouter();
  const { isLoggedIn, hasHydrated } = useAuthStore();

  // 네이티브 앱(원격 URL 래퍼)은 랜딩을 건너뛰고 바로 게임으로.
  const isNative = Capacitor.isNativePlatform();
  useEffect(() => {
    if (!isNative || !hasHydrated) return;
    router.replace(isLoggedIn ? "/lobby" : "/login");
  }, [isNative, hasHydrated, isLoggedIn, router]);

  if (isNative) return <FullScreenLoading />;

  // 웹 CTA: /login 은 로그인 상태면 /lobby 로 보내주므로 양쪽 모두 안전한 진입점.
  const playHref = "/login";

  const features = [
    { id: "daily", emoji: "🃏" },
    { id: "multi", emoji: "👥" },
    { id: "strategy", emoji: "🧠" },
    { id: "rank", emoji: "🏆" },
  ] as const;

  const storeBadges = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2.5 rounded-xl bg-snow text-void text-sm font-bold hover:opacity-90 transition active:scale-95 flex items-center gap-2"
      >
         {t("landing.cta.appstore")}
      </a>
      {PLAY_STORE_READY ? (
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-snow text-void text-sm font-bold hover:opacity-90 transition active:scale-95 flex items-center gap-2"
        >
          ▶ {t("landing.cta.googleplayReady")}
        </a>
      ) : (
        <span className="px-4 py-2.5 rounded-xl border border-edge text-haze text-sm font-bold flex items-center gap-2">
          ▶ {t("landing.cta.googleplay")}
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

  return (
    <main className="scroll-screen bg-void text-snow safe-pad-x">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-void/90 backdrop-blur-sm border-b border-edge">
        <div className="mx-auto w-full max-w-4xl px-5 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href={playHref}
              className="text-void text-xs font-extrabold px-4 py-2 rounded-xl active:scale-95 transition"
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            >
              {t("landing.cta.play")}
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="mx-auto w-full max-w-4xl px-5 pt-16 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-neon-cyan text-xs tracking-[3px] uppercase font-bold mb-4">
            {t("landing.hero.eyebrow")}
          </p>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight">
            {t("landing.hero.title1")}
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            >
              {t("landing.hero.title2")}
            </span>
          </h1>
          <p className="text-haze text-sm sm:text-base leading-relaxed max-w-xl mx-auto mt-5">
            {t("landing.hero.sub")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={playHref}
              className="text-void text-base font-extrabold px-10 py-4 rounded-2xl active:scale-95 hover:scale-[1.02] transition shadow-lg shadow-neon-cyan/20"
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
            >
              ▶ {t("landing.cta.play")}
            </Link>
            <span className="text-haze text-xs">{t("landing.cta.playSub")}</span>
            <div className="mt-2">{storeBadges}</div>
          </div>
        </motion.div>

        {/* 카드 데코 */}
        <div className="mt-14 flex items-center justify-center gap-2 sm:gap-3" aria-hidden="true">
          {["A♠", "K♠", "Q♠", "J♠", "10♠"].map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 20, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: (i - 2) * 6 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="w-14 h-20 sm:w-20 sm:h-28 bg-panel border border-neon-cyan/40 rounded-xl flex items-center justify-center text-neon-cyan font-black text-lg sm:text-2xl shadow-lg shadow-black/40"
            >
              {c}
            </motion.div>
          ))}
        </div>
        <p className="text-haze text-[11px] mt-4" aria-hidden="true">
          🍀 Royal Straight Flush · +50
        </p>

        {/* 실제 게임 화면 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 mx-auto max-w-3xl rounded-2xl border border-neon-cyan/30 overflow-hidden shadow-2xl shadow-neon-cyan/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/gameplay.webp"
            alt={t("landing.shots.gameplay")}
            width={1200}
            height={675}
            loading="eager"
            className="w-full h-auto block"
          />
        </motion.div>
      </section>

      {/* 기능 */}
      <section className="mx-auto w-full max-w-4xl px-5 py-14 border-t border-edge">
        <p className="text-neon-magenta text-[11px] tracking-[3px] uppercase font-bold mb-2 text-center">
          {t("landing.features.label")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
          {t("landing.features.title")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.id}
              className="bg-panel/60 border border-edge rounded-2xl p-6 hover:border-neon-cyan/40 transition-colors"
            >
              <span className="text-3xl" aria-hidden="true">
                {f.emoji}
              </span>
              <h3 className="text-snow font-bold text-base mt-3 mb-1.5">
                {t(`landing.feat.${f.id}.title`)}
              </h3>
              <p className="text-haze text-sm leading-relaxed">
                {t(`landing.feat.${f.id}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 스크린샷 */}
      <section className="mx-auto w-full max-w-4xl px-5 py-14 border-t border-edge">
        <div className="grid sm:grid-cols-2 gap-4">
          {(
            [
              { src: "/landing/multi.webp", key: "multi" },
              { src: "/landing/ranking.webp", key: "ranking" },
            ] as const
          ).map((s) => (
            <figure
              key={s.key}
              className="rounded-2xl border border-edge overflow-hidden bg-panel/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={t(`landing.shots.${s.key}`)}
                width={1200}
                height={675}
                loading="lazy"
                className="w-full h-auto block"
              />
              <figcaption className="px-4 py-3 text-haze text-xs">
                {t(`landing.shots.${s.key}`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="mx-auto w-full max-w-4xl px-5 py-14 border-t border-edge">
        <p className="text-neon-cyan text-[11px] tracking-[3px] uppercase font-bold mb-2 text-center">
          {t("landing.how.label")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
          {t("landing.how.title")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="text-center px-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-panel border border-neon-cyan/40 flex items-center justify-center text-neon-cyan font-black">
                {n}
              </div>
              <h3 className="text-snow font-bold text-sm mt-3 mb-1">
                {t(`landing.how.${n}.title`)}
              </h3>
              <p className="text-haze text-xs leading-relaxed">
                {t(`landing.how.${n}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-2xl px-5 py-14 border-t border-edge">
        <p className="text-neon-magenta text-[11px] tracking-[3px] uppercase font-bold mb-2 text-center">
          {t("landing.faq.label")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8">
          {t("landing.faq.title")}
        </h2>
        <div className="space-y-3">
          {([1, 2, 3, 4] as const).map((n) => (
            <details
              key={n}
              className="bg-panel/60 border border-edge rounded-2xl px-5 py-4 group"
            >
              <summary className="text-snow text-sm font-bold cursor-pointer list-none flex items-center justify-between">
                {t(`landing.faq.${n}.q`)}
                <span className="text-haze group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <p className="text-haze text-sm leading-relaxed mt-3">
                {t(`landing.faq.${n}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 전략 가이드 */}
      <section className="mx-auto w-full max-w-4xl px-5 py-14 border-t border-edge">
        <p className="text-neon-cyan text-[11px] tracking-[3px] uppercase font-bold mb-2 text-center">
          {t("landing.guide.label")}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8">
          {t("landing.guide.title")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["scoring", "strategy"] as const).map((g) => (
            <Link
              key={g}
              href={`/guide/${g}`}
              className="bg-panel/60 border border-edge rounded-2xl p-6 hover:border-neon-magenta/40 transition-colors block"
            >
              <h3 className="text-snow font-bold text-base mb-1.5">
                {t(`landing.guide.${g}.title`)}
              </h3>
              <p className="text-haze text-sm leading-relaxed mb-3">
                {t(`landing.guide.${g}.desc`)}
              </p>
              <span className="text-neon-cyan text-xs font-bold">
                {t("landing.guide.read")} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="mx-auto w-full max-w-4xl px-5 py-16 border-t border-edge text-center">
        <h2 className="text-2xl sm:text-3xl font-black mb-2">{t("landing.bottom.title")}</h2>
        <p className="text-haze text-sm mb-7">{t("landing.bottom.sub")}</p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href={playHref}
            className="text-void text-base font-extrabold px-10 py-4 rounded-2xl active:scale-95 hover:scale-[1.02] transition"
            style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
          >
            ▶ {t("landing.cta.play")}
          </Link>
          {storeBadges}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-edge">
        <div className="mx-auto w-full max-w-4xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-haze text-xs">
          <span>© 2026 TENTENS</span>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
