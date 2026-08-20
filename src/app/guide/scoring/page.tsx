import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "포커 족보 점수 계산법 — TENTENS 점수 규칙 총정리",
  description:
    "TENTENS의 12종 포커 조합 점수표, 인접 슬롯 규칙, 조커 자동 배정, 동점 처리 방식을 예시와 함께 설명합니다.",
};

const SCORE_TABLE = [
  ["로열 스트레이트 플러시", "10-J-Q-K-A + 같은 문양", 50],
  ["백 스트레이트 플러시", "A-2-3-4-5 + 같은 문양", 40],
  ["스트레이트 플러시", "연속 5장 + 같은 문양", 35],
  ["포카드", "같은 숫자 4장", 30],
  ["풀하우스", "트리플 + 페어", 24],
  ["플러시", "같은 문양 5장 (숫자 무관)", 20],
  ["마운틴", "10-J-Q-K-A", 16],
  ["백스트레이트", "A-2-3-4-5", 14],
  ["스트레이트", "숫자 5장 연속", 13],
  ["트리플", "같은 숫자 3장", 10],
  ["투페어", "페어 2개", 6],
  ["원페어", "같은 숫자 2장", 2],
] as const;

const ScoringGuidePage = () => (
  <article>
    <p className="text-neon-magenta text-[10px] tracking-[2px] uppercase font-bold">
      01 · 점수 규칙
    </p>
    <h1 className="text-2xl font-extrabold mt-2">
      포커 족보 점수 계산, 이렇게 됩니다
    </h1>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        기본: 인접한 카드만 조합이 됩니다
      </h2>
      <div className="text-haze text-sm leading-7 space-y-2">
        <p>
          TENTENS의 점수 규칙은 포커 족보를 따르지만, 결정적인 차이가 하나
          있습니다. <strong className="text-snow">조합은 연속된(인접한) 슬롯의
          카드로만 성립</strong>한다는 것. 보드 어딘가에 K가 세 장 흩어져
          있어도, 붙어 있지 않으면 트리플이 아닙니다.
        </p>
        <p>
          그래서 이 게임의 실력은 &ldquo;좋은 카드를 기다리는 것&rdquo;이 아니라
          &ldquo;조합이 만들어질 자리를 미리 설계하는 것&rdquo;에서 갈립니다.
          같은 카드 10장을 받아도 배치 순서에 따라 점수가 두 배 넘게 차이날 수
          있습니다.
        </p>
      </div>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">12종 조합 점수표</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-haze text-[11px] tracking-wider uppercase border-b border-edge">
              <th className="text-left py-2 pr-2">조합</th>
              <th className="text-left py-2 pr-2">조건 (모두 인접 슬롯)</th>
              <th className="text-right py-2">점수</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_TABLE.map(([name, cond, score]) => (
              <tr key={name} className="border-b border-edge/50">
                <td className="py-2 pr-2 text-snow font-medium">{name}</td>
                <td className="py-2 pr-2 text-haze">{cond}</td>
                <td className="py-2 text-right text-yellow-400 font-bold">
                  {score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-haze text-sm leading-7 mt-3">
        투페어(6점)가 원페어 두 개(2+2=4점)보다 높다는 점, 스트레이트(13점)보다
        플러시(20점)가 크게 앞선다는 점을 기억해두면 중반 판단이 빨라집니다.
      </p>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        조커: 총점이 최대가 되도록 자동 배정
      </h2>
      <div className="text-haze text-sm leading-7 space-y-2">
        <p>
          덱에는 조커가 2장 들어 있습니다. 조커는 배치만 잘하면 게임이 알아서
          <strong className="text-snow"> 총점이 가장 높아지는 카드로
          계산</strong>해 줍니다. 스트레이트의 빈 칸을 채울지, 트리플을
          포카드로 승격시킬지 직접 정할 필요가 없어요.
        </p>
        <p>
          단, 조커도 인접 규칙을 따릅니다. 완성 직전인 조합 옆에 붙여야 값어치를
          하고, 외딴 자리에 두면 그냥 버리는 카드가 됩니다.
        </p>
      </div>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        한 카드는 한 조합에만 — 최적 조합은 자동 선택
      </h2>
      <p className="text-haze text-sm leading-7">
        같은 카드를 두 조합에 겹쳐 쓸 수는 없습니다. 여러 해석이 가능한
        보드라면 게임이 모든 경우를 비교해{" "}
        <strong className="text-snow">총점이 가장 높은 조합 세트를 자동으로
        채택</strong>합니다. 계산은 게임에 맡기고, 여러분은 조합의 재료가 인접해
        있도록 배치에만 집중하면 됩니다.
      </p>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">동점이면?</h2>
      <p className="text-haze text-sm leading-7">
        멀티플레이에서 총점이 같으면 조합에 사용된 카드 숫자의 합(A=14)으로
        순위를 가립니다. 그것마저 같으면 공동 순위로 처리되고, 보상도 동일하게
        지급됩니다.
      </p>
    </section>

    <div className="mt-10 bg-panel/60 border border-edge rounded-2xl p-5 text-center">
      <p className="text-snow text-sm font-bold mb-3">
        규칙을 알았다면, 이제 점수로 증명할 차례
      </p>
      <Link
        href="/login"
        className="inline-block text-void text-sm font-extrabold px-8 py-3 rounded-xl"
        style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
      >
        ▶ 무료로 플레이
      </Link>
      <p className="mt-4">
        <Link href="/guide/strategy" className="text-neon-cyan text-xs font-bold">
          다음 글: 고수들의 카드 배치 전략 →
        </Link>
      </p>
    </div>
  </article>
);

export default ScoringGuidePage;
