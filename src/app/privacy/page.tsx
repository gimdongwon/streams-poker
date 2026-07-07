import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - TENTENS",
  description: "TENTENS 개인정보처리방침",
};

// 운영자/연락처/시행일은 실제 정보로 교체하세요. (스토어 제출 전 검토 권장)
const OPERATOR = "김동원 (winter1)";
const CONTACT_EMAIL = "ehddnjs8989@gmail.com";
const EFFECTIVE_DATE = "2026년 7월 1일";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-7">
    <h2 className="text-snow text-base font-bold mb-2">{title}</h2>
    <div className="text-haze text-sm leading-7 space-y-2">{children}</div>
  </section>
);

const PrivacyPage = () => {
  return (
    <main className="scroll-screen bg-void text-snow safe-pad-x">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link href="/lobby" className="text-haze hover:text-snow text-xs">
          ← 돌아가기
        </Link>

        <h1 className="text-2xl font-extrabold mt-4">개인정보처리방침</h1>
        <p className="text-haze text-xs mt-2">시행일: {EFFECTIVE_DATE}</p>

        <p className="text-haze text-sm leading-7 mt-5">
          {OPERATOR}(이하 “운영자”)은(는) 이용자의 개인정보를 중요하게 생각하며,
          『개인정보 보호법』 등 관련 법령을 준수합니다. 본 방침은 TENTENS(이하
          “서비스”)에서 어떤 정보를 수집·이용하며 어떻게 보호하는지를 설명합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <p>운영자는 서비스 제공을 위해 다음 정보를 수집합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 정보: 아이디, 닉네임, 비밀번호(단방향 암호화하여 저장)</li>
            <li>게임 정보: 게임 점수·기록, 누적 점수·랭킹, 플레이한 게임 수</li>
            <li>친구 정보: 친구 요청 및 친구 관계</li>
            <li>
              자동 수집 정보: 접속 일시, 기기·브라우저 정보, 쿠키 및 유사 기술을 통한
              이용 통계(서비스 개선·분석 목적)
            </li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 및 로그인 등 본인 식별·인증</li>
            <li>게임 진행, 점수·랭킹·티어 산정, 친구 기능 제공</li>
            <li>서비스 운영·개선, 이용 통계 분석, 오류 및 부정 이용 방지</li>
          </ul>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          <p>
            수집된 개인정보는 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 관련
            법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p>
            운영자는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 법령에 근거가
            있거나 수사기관의 적법한 요청이 있는 경우는 예외로 합니다.
          </p>
        </Section>

        <Section title="5. 개인정보 처리의 위탁">
          <p>운영자는 서비스 제공을 위해 아래 업무를 외부에 위탁할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase: 데이터베이스 저장 및 인증·호스팅</li>
            <li>Google Analytics / Google Tag Manager: 이용 통계 분석</li>
            <li>
              Google AdMob: 광고 제공(향후 도입 시). 광고 식별자 등은 해당 사업자의
              정책에 따라 처리됩니다.
            </li>
          </ul>
        </Section>

        <Section title="6. 쿠키 및 유사 기술">
          <p>
            서비스는 이용 통계 분석 및 광고(향후) 목적으로 쿠키 등 기술을 사용할 수
            있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우
            일부 기능 이용이 제한될 수 있습니다.
          </p>
        </Section>

        <Section title="7. 이용자의 권리와 행사 방법 (계정·데이터 삭제)">
          <p>
            이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 회원 탈퇴를 통해
            처리 정지를 요청할 수 있습니다.
          </p>
          <p>
            <span className="text-snow">계정 삭제</span>는 앱/웹에 로그인한 뒤{" "}
            <span className="text-snow">우측 상단 계정 메뉴 → “계정 삭제”</span>에서 직접
            실행할 수 있습니다. 계정을 삭제하면 회원 정보와 게임 기록·랭킹·친구 관계 등
            관련 데이터가 <span className="text-snow">영구적으로 삭제되며 복구할 수 없습니다.</span>
          </p>
          <p>
            직접 삭제가 어려운 경우 아래 문의처로 연락 주시면 지체 없이 조치합니다.
          </p>
        </Section>

        <Section title="8. 개인정보의 안전성 확보 조치">
          <ul className="list-disc pl-5 space-y-1">
            <li>비밀번호는 복호화가 불가능한 방식으로 암호화하여 저장</li>
            <li>접근 권한 관리 및 전송 구간 암호화(HTTPS)</li>
          </ul>
        </Section>

        <Section title="9. 만 14세 미만 아동의 개인정보">
          <p>
            운영자는 만 14세 미만 아동의 개인정보를 법정대리인의 동의 없이 수집하지
            않습니다.
          </p>
        </Section>

        <Section title="10. 개인정보 보호책임자 및 문의처">
          <p>
            개인정보 관련 문의: {OPERATOR} (이메일: {CONTACT_EMAIL})
          </p>
        </Section>

        <Section title="11. 방침의 변경">
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내
            공지를 통해 고지합니다.
          </p>
        </Section>

        <div className="mt-10">
          <Link
            href="/lobby"
            className="inline-block text-haze hover:text-snow text-xs border border-edge rounded-lg px-4 py-2 hover:bg-edge transition-colors"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;
