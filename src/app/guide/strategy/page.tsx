import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "카드 배치 전략 가이드 — TENTENS 고수들의 요령",
  description:
    "TENTENS에서 평균 점수를 끌어올리는 배치 전략. 초반 슬롯 설계, 중반 리스크 관리, 조커와 마지막 라운드 운영법을 정리했습니다.",
};

const StrategyGuidePage = () => (
  <article>
    <p className="text-neon-magenta text-[10px] tracking-[2px] uppercase font-bold">
      02 · 배치 전략
    </p>
    <h1 className="text-2xl font-extrabold mt-2">고수들의 카드 배치 전략</h1>

    <p className="text-haze text-sm leading-7 mt-4">
      10라운드, 라운드당 10초. 되돌릴 수 없는 선택이 열 번 쌓이면 점수가
      됩니다. 운이 아니라 설계로 이기는 법을 단계별로 정리했습니다.
    </p>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        초반 (1~3라운드): 보드를 구역으로 나누세요
      </h2>
      <div className="text-haze text-sm leading-7 space-y-2">
        <p>
          첫 실수는 대부분 &ldquo;좋은 카드를 가운데에 두는 것&rdquo;에서
          시작됩니다. 조합은 인접해야 성립하므로, 중요한 건 카드의 위치가
          아니라 <strong className="text-snow">구역 계획</strong>입니다.
        </p>
        <p>
          많이 쓰는 설계는 5+5 분할입니다. 왼쪽 다섯 칸은 플러시나
          스트레이트처럼 5장짜리 큰 조합을 노리는 구역, 오른쪽 다섯 칸은
          페어·트리플 같은 숫자 조합을 모으는 구역. 초반 카드는 이 기준으로
          분류만 해도 충분합니다.
        </p>
        <p>
          같은 문양이 이어서 나오면 망설이지 말고 큰 조합 구역에 붙이세요.
          플러시(20점)는 스트레이트(13점)보다 완성 확률 대비 배당이 좋습니다.
        </p>
      </div>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        중반 (4~7라운드): 손절 타이밍이 실력입니다
      </h2>
      <div className="text-haze text-sm leading-7 space-y-2">
        <p>
          중반의 핵심 질문은 하나입니다 — &ldquo;이 구역, 아직 살아
          있나?&rdquo; 플러시를 노리던 구역에 세 라운드째 다른 문양만 온다면,
          미련을 버리고 그 구역을 페어 저장소로 전환하세요.{" "}
          <strong className="text-snow">죽은 조합에 카드를 계속 태우는 것</strong>
          이 중위권과 상위권을 가르는 가장 큰 차이입니다.
        </p>
        <p>
          전환할 때 기준은 기대값입니다. 완성까지 2장 남은 플러시(20점)보다,
          지금 확정할 수 있는 투페어(6점)+트리플(10점)이 나을 때가 많습니다.
          남은 라운드 수를 항상 세면서 판단하세요.
        </p>
      </div>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        조커: 아껴두지 말고, 자리를 만들어두세요
      </h2>
      <div className="text-haze text-sm leading-7 space-y-2">
        <p>
          조커는 총점이 최대가 되도록 자동 계산되지만, 인접해 있어야만
          일합니다. 고수들은 조커가 나오기 전부터{" "}
          <strong className="text-snow">&ldquo;조커가 오면 여기&rdquo;라는 빈
          칸</strong>을 하나 관리합니다 — 보통 4장까지 모인 스트레이트나
          플러시 옆자리입니다.
        </p>
        <p>
          조커가 일찍 나왔는데 완성 직전인 조합이 없다면, 트리플 옆에 두는 게
          무난합니다. 포카드(30점) 승격 가능성과 풀하우스 재료를 동시에
          잡아둘 수 있어서요.
        </p>
      </div>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        막판 (8~10라운드): 빈 칸은 어차피 채워집니다
      </h2>
      <p className="text-haze text-sm leading-7">
        마지막 세 장은 선택지가 없어 보이지만, 사실 가장 점수 차가 벌어지는
        구간입니다. 남은 빈 칸 중 <strong className="text-snow">어느 자리가
        기존 조합을 깨지 않는지</strong>를 먼저 보세요. 쓸모없는 카드는 이미
        죽은 구역에, 애매한 카드는 페어 가능성이 있는 자리에. 10초 타이머가
        급해도 이 우선순위 하나면 실수가 크게 줄어듭니다.
      </p>
    </section>

    <section className="mt-7">
      <h2 className="text-snow text-base font-bold mb-2">
        연습은 오늘의 덱에서
      </h2>
      <p className="text-haze text-sm leading-7">
        전략이 늘고 있는지 확인하는 가장 좋은 방법은{" "}
        <strong className="text-snow">오늘의 덱</strong>입니다. 매일 전 세계
        모두가 같은 덱으로 하루 한 번 겨루기 때문에, 순위가 곧 순수한 배치
        실력의 지표가 됩니다. 어제보다 높은 백분위가 목표!
      </p>
    </section>

    <div className="mt-10 bg-panel/60 border border-edge rounded-2xl p-5 text-center">
      <p className="text-snow text-sm font-bold mb-3">
        오늘의 덱에서 바로 연습해보세요
      </p>
      <Link
        href="/login"
        className="inline-block text-void text-sm font-extrabold px-8 py-3 rounded-xl"
        style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
      >
        ▶ 무료로 플레이
      </Link>
      <p className="mt-4">
        <Link href="/guide/scoring" className="text-neon-cyan text-xs font-bold">
          이전 글: 포커 족보 점수 계산법 →
        </Link>
      </p>
    </div>
  </article>
);

export default StrategyGuidePage;
