# 🃏 TENTENS

> 10라운드 전략 카드 배치 게임 — 같은 카드, 다른 전략으로 승부하라!

모든 플레이어에게 동일한 카드가 순서대로 공개되고, 매 라운드 카드를 10개 슬롯 중 하나에 배치해 포커 조합 점수를 겨루는 실시간 멀티플레이 게임입니다. 배치한 카드는 되돌릴 수 없기 때문에, **운이 아니라 배치 전략**이 승부를 가릅니다.

**정식 출시**: [App Store](https://apps.apple.com/app/id6792527133) (iOS) · [Google Play](https://play.google.com/store/apps/details?id=kr.tentens.app) (Android) · [tentens.kr](https://www.tentens.kr) (웹)

---

## ✨ Features

### 게임 플레이
- **54장 덱**(52장 + 조커 2장)에서 매 라운드 카드 공개, **10라운드 / 라운드당 10초 타이머**
- 10개 슬롯에 전략적 배치 (배치 후 변경 불가)
- **12종 포커 조합** 판정 (로열 스트레이트 플러시 ~ 원페어)
- **인접 슬롯 규칙** — 모든 조합은 연속된 슬롯에서만 성립 (슬롯 순서가 곧 전략)
- **총점 최대화 판정** — 조커 배분·스트레이트 위치·페어 묶음을 모두 비교해 **가장 높은 총점**을 내는 조합 집합을 자동 선택
- **게임 나가기** — 진행 중 언제든 확인 모달을 거쳐 퇴장 (멀티는 서버 좌석 즉시 정리)

### 게임 모드
- **튜토리얼** — 첫 방문 시 제안되는 5라운드 온보딩 (고정 덱 + 코치마크 + 추천 슬롯 반짝임)
  - 타이머 없음, **언제든 건너뛰기 가능**, 완료 보상 +100 코인 (유저당 1회, 서버 중복 방지)
- **싱글 플레이** — 혼자 최고 점수에 도전, "한번 더"로 연속 플레이
- **오늘의 덱 (데일리 챌린지)** — 매일 전 세계가 **같은 덱**으로 하루 한 번 도전, 그날의 랭킹 경쟁
  - 날짜+비밀 솔트 시드의 결정적 셔플 (서버 전용 생성 — 사전 계산 불가)
  - 시작 시 도전권 소진 (중도 이탈 재도전 방지), 참여 보상 **+20 코인**, 결과는 누적 랭킹에도 반영
  - 결과 공유 문구로 바이럴 유도 ("오늘의 덱 4,120점 — 3위/47명")
- **멀티 플레이** — Socket.io 실시간 대전 (**최대 15명**)
  - **⚡ 바로 대전(퀵매치)** — 대기 중인 방에 즉시 매칭, 8초 내 사람이 안 모이면 **봇으로 4인을 채워 자동 시작** (재경기도 자동)
  - **봇 플레이어** — 부분 보드 점수 최대화 휴리스틱 + 봇별 실수 확률(실력 편차), 🤖 BOT 배지로 표시, 보상/랭킹 미참여
  - 방 만들기 / 방 찾기(공개 방 목록 + 코드 입력 통합)
  - **라운드 동기화** — 전원이 배치를 완료해야 다음 라운드로 진행 (이중 시작·라운드 중복 진행 가드)
  - **재접속 복구** — 새로고침·일시 끊김 시 진행 중이던 방/보드로 복귀 (대기방도 좌석 유예), 라운드 타이머는 서버 기준 남은 시간으로 복원
  - **동점 처리** — 총점 → 타이브레이커(높은 카드 우선, 사전식 비교 — A플러시 > K플러시) → 공동 순위
  - **초대 링크 + 딥링크** — 방 코드 공유 링크로 바로 입장 (Universal Links / App Links)
  - **퀵챗(이모트)** — 대기방·게임 중 사전 정의 문구/이모지 8종 전송 (자유 입력 없음 → UGC 규제 비대상, 서버 쿨다운으로 도배 방지)

### 코인 & 보상 (베팅 없음)
- **코인** — 신규 유저 500 코인 시작. **잃는 요소 없음** (Apple 개인 계정 모의도박 금지 정책 준수)
- **멀티 순위 보상** — 시스템 지급: **1등 +100 / 2등 +50 / 참가 +10** (공동 순위 동일 보상, 이벤트 기간 배수 지원)
- **일일 보상 (연속 출석 스트릭)** — 1일차 100 → 매일 +20 → 7일 이상 300 코인 (KST). 네이티브 앱에선 **리워드 광고(AdMob)** 시청 후 지급
- **친구 초대 보상** — 초대 링크로 가입한 친구가 **첫 게임을 완료하면** 양쪽 +200 (추천인 최대 10명)
- **업적** — 조합/판수 등 달성 시 코인 보상
- 모든 코인 처리는 **서버 권위**(원자적 RPC) + **코인 로그**(`coin_log`) 기록 — 조작 불가, 오늘 획득 집계 지원

### 랭킹 & 소셜
- **랭킹보드** — **오늘(기본)** / 누적 / 오늘의 덱 3탭. 오늘 탭은 내 획득 점수·코인·판수 카드 + 오늘 점수 상위 10 리스트
- 누적 탭은 점수순·코인순 정렬, **10위 밖이면 내 순위 별도 표시**. 게스트도 랭킹에 포함
- **티어 시스템** — 누적 점수로 Bronze → Diamond 5단계, 배지 + 진행도 바, **승급 축하 팝업**
- **친구** — 아이디로 추가 / 대기방에서 바로 친구 요청 / 요청 수락·거절, 친구 요청 푸시 알림
- **결과 이미지 카드** — 캔버스 브랜딩 카드 생성 → 저장/공유
- **공지사항** — 목록형 레이어 (배포만으로 갱신, autoShow 공지는 로비 자동 노출, "다시 보지 않기")
- **마이페이지(`/me`)** — 프로필·전적·코인·티어·친구·설정·계정 통합

### 계정 (게스트 퍼스트)
- **"임시로 시작하기"만으로 모든 기능 사용** — 싱글·멀티·랭킹·코인 전부 게스트 가능
- **소셜 로그인 = 기록 백업** — Sign in with Apple / Google 연결 시 같은 users.id 유지로 전적/코인 그대로 이전 (기기 변경·재설치 대비)
- 서버에서 ID 토큰 공개키 검증, 아이디/비밀번호(bcrypt)는 보조 수단(모달 레이어), 중복 로그인 강제 종료, 계정 삭제

### 사용자 경험
- **다국어(i18n)** — 한국어 / English, 기기 언어 자동 감지 + 수동 토글
- **사운드** — 배치·타이머·결과·승리 효과음 + 음소거 토글
- **로딩 정비** — 전체 화면 로딩(FullScreenLoading)으로 페이지 전환 빈 화면 제거, 결과 집계 대기 스피너 (모든 비동기 UI에 로딩 표시)
- **결과 공유** — Web Share API(미지원 시 클립보드), OG/Twitter 카드 썸네일
- **랜딩 페이지 + 가이드** — 게임 소개·전략/점수 가이드 콘텐츠, sitemap/robots/JSON-LD SEO
- **인앱 리뷰** — 10판 이상 + 좋은 순간에 스토어 리뷰 요청 (OS 노출 제한 준수)
- 가로모드 우선 반응형(소개 페이지는 세로 허용), 세로 화면 회전 안내, 게임 중 족보 모달

### 네이티브 앱 (Capacitor / iOS·Android)
- **원격 URL 래퍼** — 웹 배포가 앱에 즉시 반영 (네이티브 변경 시에만 재빌드)
- **푸시 알림** — FCM(HTTP v1) 통합, iOS(APNs)/Android 모두 동작, 무효 토큰 자동 정리
- **광고(AdMob)** — 리워드(일일 보상) + **전면 광고(5판마다, 60초 쿨다운, 광고 닫힘 대기 후 진행)**
  - 광고 실패 시에도 게임/보상 진행 (유저를 막지 않음)
  - **UMP(GDPR) 동의 폼 → ATT 순서** (Apple 5.1.1(iv) 준수), EEA 외 지역은 동의 폼 미표시
  - app-ads.txt 루트 도메인 서빙 (AdMob 앱 인증)
- **딥링크** — Universal Links(AASA) / App Links(assetlinks.json)로 초대 링크가 앱으로 바로 연결
- **Firebase Analytics** — 게임 완료·방 생성/참여·로그인·보상·광고 노출 이벤트 (IDFA 미사용 1차 분석)
- GA/GTM은 **웹 브라우저 전용** — 네이티브 앱에서는 로드하지 않음 (ATT 추적 거부 준수)
- 카드 배치 햅틱, 네이티브 공유 시트, 가로모드 고정, 스플래시·상태바

### 신뢰성 / 보안
- **서버 권위 점수 계산(anti-cheat)** — 싱글·멀티·데일리 모두 서버가 보드(slots)를 재평가해 저장
- **점수 계산 회귀 테스트** — `npm test` (node:test + tsx, 21케이스)
- **DB 장애 graceful 처리** — 저장/조회 실패가 게임 플레이를 막지 않음
- **Row Level Security** — 랭킹 뷰·테이블 서버 전용 잠금

---

## 🛠 Tech Stack

| 분류 | 기술 | 버전 |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| UI | React | 19 |
| Styling | TailwindCSS | 4 |
| State | Zustand | 5 |
| Animation | Framer Motion | 12 |
| Realtime | Socket.io | 4.8 |
| Database / Auth | Supabase (PostgreSQL) + bcryptjs + jose(소셜 토큰 검증) | - |
| Server | 커스텀 Node 서버 (Next.js + Socket.io, `tsx`) | - |
| Mobile | Capacitor (iOS / Android 래퍼) | 8 |
| Ads | Google AdMob (리워드 + 전면, UMP 동의) | - |
| Analytics | Firebase Analytics(앱) · GA4 + GTM(웹) | - |
| Push | Firebase Cloud Messaging (HTTP v1) | - |
| Deploy | Railway (웹 + 소켓 서버) | - |

---

## 📁 Project Structure

```
streams-poker/
├── server/                       # 커스텀 서버 (Next.js + Socket.io, tsx 실행)
│   ├── index.ts                  # HTTP 서버 + Socket.io 부트스트랩
│   ├── state.ts                  # 인메모리 방/세션 상태, 재접속 유예 타이머
│   ├── rounds.ts                 # 라운드 타이머/진행/완료 판정 (봇 배치 연동)
│   ├── gameflow.ts               # 게임 시작/결과 정산 공통 로직 (이중 시작 가드)
│   ├── bots.ts                   # 봇 플레이어 (배치 휴리스틱 + 실수 확률 + 스케줄링)
│   ├── deck.ts / scoring.ts      # 서버측 덱 생성 / 서버 권위 점수 재계산
│   ├── coins.ts                  # 코인 지급 (원자적 RPC 호출)
│   └── handlers/                 # auth / room(퀵매치 포함) / game / chat(퀵챗) 소켓 핸들러
├── src/
│   ├── app/
│   │   ├── login/                # 인증 (게스트 시작 + 소셜 로그인 = 기록 백업)
│   │   ├── lobby/                # 로비 (오늘의 덱·플레이하기, 랭킹보드·공지·족보, 승급 팝업)
│   │   ├── tutorial/             # 첫 설치 튜토리얼 (5라운드 코치마크, 스킵 가능)
│   │   ├── room/[roomId]/        # 멀티 대기방 (퀵매치 자동 시작·BOT 배지·초대·퀵챗)
│   │   ├── game/[roomId]/        # 게임 화면 (single / daily / multi)
│   │   ├── guide/                # 전략·점수 가이드 (SEO 콘텐츠)
│   │   ├── privacy/              # 개인정보처리방침 (고정 헤더)
│   │   └── api/                  # auth(+social/guest/upgrade), coins(+daily), referral,
│   │                             #   leaderboard(+rank), daily(start/submit/leaderboard),
│   │                             #   me/today(오늘 통계), tutorial/reward, achievements, friends
│   ├── components/
│   │   ├── game/                 # Board, GameScreen, ResultScreen, Leaderboard, EmoteLayer 등
│   │   ├── common/               # Logo, Spinner, FullScreenLoading, TierBadge, CoinBalance 등
│   │   └── auth/                 # AuthForm, UpgradeAccountModal, DeleteAccountModal
│   ├── stores/                   # Zustand: auth, game, room, settings, i18n
│   ├── lib/
│   │   ├── poker/                # deck(셔플), evaluator(조합 판정·조커·타이브레이커)
│   │   ├── i18n/                 # locales, useT, messages/(네임스페이스별 ko/en)
│   │   ├── daily.ts              # 오늘의 덱 시드 셔플 (서버 전용)
│   │   ├── ads.ts                # AdMob 리워드/전면 + UMP/ATT 동의 흐름
│   │   ├── analytics.ts          # Firebase Analytics 이벤트
│   │   ├── emotes.ts · push.ts · coins.ts · tier.ts · share.ts …
│   └── types/                    # card, game, room, auth, leaderboard
├── ios/ · android/               # Capacitor 네이티브 프로젝트
├── supabase/migrations/          # SQL 마이그레이션 (번호순 수동 실행)
├── store-assets/                 # 스토어 스크린샷 등
└── docs/                         # 스토어 등록 카피, iOS 런북 등
```

---

## 🏆 Scoring

| 조합 | 조건 (모두 인접 슬롯) | 점수 |
| --- | --- | --- |
| 로열 스트레이트 플러시 | 10-J-Q-K-A + 같은 문양 | 50 |
| 백 스트레이트 플러시 | A-2-3-4-5 + 같은 문양 | 40 |
| 스트레이트 플러시 | 연속 5장 + 같은 문양 | 35 |
| 포카드 | 같은 숫자 4장 | 30 |
| 풀하우스 | 트리플 + 페어 | 24 |
| 플러시 | 같은 문양 5장 (숫자 무관) | 20 |
| 마운틴 | 10-J-Q-K-A | 16 |
| 백스트레이트 | A-2-3-4-5 | 14 |
| 스트레이트 | 숫자 5장 연속 | 13 |
| 트리플 | 같은 숫자 3장 | 10 |
| 투페어 | 페어 2개 | 6 |
| 원페어 | 같은 숫자 2장 | 2 |

- **인접 규칙**: 모든 조합은 연속된 슬롯의 카드로만 성립합니다.
- **조커**: 총점이 최대가 되도록 자동 배정됩니다.
- **동점**: 총점 → 타이브레이커(조합에 쓰인 카드를 높은 순으로 사전식 비교, A=14 — 예: A플러시 > K플러시) → 그래도 같으면 공동 순위.

### 티어 구간 (누적 점수)

| 티어 | 최소 누적 점수 |
| --- | --- |
| Bronze | 0 |
| Silver | 100 |
| Gold | 300 |
| Platinum | 700 |
| Diamond | 1500 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase 프로젝트

### 1. 설치

```bash
git clone <repo-url>
cd streams-poker
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local` 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 오늘의 덱 시드 (긴 랜덤 문자열 — 클라이언트 사전 계산 방지)
DAILY_SECRET=your_random_secret

# 소셜 로그인 (선택)
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=...   # Google idToken audience
APPLE_AUDIENCE=kr.tentens.app          # Apple 번들 ID

# 푸시 알림 (선택, FCM HTTP v1 서비스 계정)
FCM_PROJECT_ID=...
FCM_CLIENT_EMAIL=...
FCM_PRIVATE_KEY=...

# 선택: 프로덕션 포트 (기본 3000)
PORT=3000
```

### 3. 데이터베이스

`users` / `leaderboard` 기본 테이블을 만든 뒤, `supabase/migrations/`의 SQL을 **번호 순서대로** Supabase SQL Editor에 실행합니다.

| 파일 | 내용 |
| --- | --- |
| `0001_user_cumulative_ranking.sql` | 누적 랭킹 뷰 (`user_rankings`) |
| `0002_friendships.sql` | 친구 관계 테이블 |
| `0003_best_combo.sql` | 역대 최고 조합 컬럼/뷰 |
| `0004~0006` | RLS 잠금/보정 |
| `0007_coins.sql` | 코인 + 일일보상·지급 원자적 함수 |
| `0008_push_tokens.sql` | 푸시 토큰 테이블 |
| `0009_guest_users.sql` | 게스트 계정 |
| `0010_social_identity.sql` | 소셜 로그인 연동 (Apple/Google) |
| `0011_daily_deck.sql` | 오늘의 덱 기록 (`daily_scores`, 1일 1회) |
| `0012_daily_streak.sql` | 연속 출석 스트릭 보상 (100→+20/일→300) |
| `0013_achievements.sql` | 업적 테이블 |
| `0014_referral.sql` | 친구 초대 보상 (`referred_by`) |
| `0015_guest_first.sql` | 게스트 퍼스트 — 랭킹에 게스트 포함 |
| `0016_coin_log.sql` | 코인 로그 (오늘 획득 집계·튜토리얼 보상 1회 제한) |

### 4. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 시작합니다. `npm run dev`는 커스텀 서버(`server/index.ts`)를 실행해 Next.js와 Socket.io를 함께 구동합니다.

### 5. 네이티브 앱 (선택)

```bash
npx cap sync ios      # iOS: Xcode에서 Product → Archive
npx cap sync android  # Android: Android Studio에서 Generate Signed App Bundle
```

원격 URL 래퍼 방식이라 웹 기능 변경은 재빌드 없이 반영됩니다. 네이티브 플러그인/설정 변경 시에만 재빌드가 필요합니다.

---

## 📜 Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (커스텀 서버 + Socket.io) |
| `npm run dev:next` | Next.js 개발 서버만 (Socket.io 없음) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm test` | 점수 계산 회귀 테스트 (node:test + tsx, 21케이스) |

---

## 📄 License

MIT

---

*Built with Next.js, Socket.io, and Supabase*
