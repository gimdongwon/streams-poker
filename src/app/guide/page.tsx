import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TENTENS 전략 가이드 — 포커 족보 점수와 카드 배치 전략",
  description:
    "카드 배치 게임 TENTENS를 더 잘하는 방법. 포커 족보 점수 계산법과 고수들의 배치 전략을 정리했습니다.",
};

const GUIDES = [
  {
    href: "/guide/scoring",
    tag: "01 · 점수 규칙",
    title: "포커 족보 점수 계산, 이렇게 됩니다",
    desc: "12종 조합 점수표, 인접 슬롯 규칙, 조커 자동 배정과 동점 처리까지 점수의 모든 것.",
    time: "5분 읽기",
  },
  {
    href: "/guide/strategy",
    tag: "02 · 배치 전략",
    title: "고수들의 카드 배치 전략",
    desc: "초반 슬롯 설계, 중반 리스크 관리, 막판 조커 활용 — 평균 점수를 끌어올리는 실전 요령.",
    time: "6분 읽기",
  },
];

const GuideIndexPage = () => (
  <>
    <h1 className="text-2xl font-extrabold">TENTENS 전략 가이드</h1>
    <p className="text-haze text-sm leading-7 mt-3">
      같은 카드를 받아도 점수는 사람마다 다릅니다. 규칙을 정확히 알고 배치를
      설계하는 것이 실력의 전부인 게임 — 그 출발점이 되는 글들을 모았습니다.
    </p>
    <div className="mt-8 space-y-4">
      {GUIDES.map((g) => (
        <Link
          key={g.href}
          href={g.href}
          className="block bg-panel/60 border border-edge rounded-2xl p-5 hover:border-neon-cyan/40 transition-colors"
        >
          <p className="text-neon-magenta text-[10px] tracking-[2px] uppercase font-bold">
            {g.tag}
          </p>
          <h2 className="text-snow font-bold text-base mt-1.5">{g.title}</h2>
          <p className="text-haze text-sm leading-relaxed mt-1.5">{g.desc}</p>
          <span className="text-neon-cyan text-xs font-bold mt-3 inline-block">
            {g.time} →
          </span>
        </Link>
      ))}
    </div>
  </>
);

export default GuideIndexPage;
