# 🃏 TENTENS

> 10라운드 전략 카드 배치 게임 — 같은 카드, 다른 전략으로 승부하라!

모든 플레이어에게 동일한 카드가 순서대로 공개되고, 매 라운드 카드를 10개 슬롯 중 하나에 배치해 포커 조합 점수를 겨루는 실시간 멀티플레이 웹 게임입니다. 배치한 카드는 되돌릴 수 없기 때문에, **운이 아니라 배치 전략**이 승부를 가릅니다.

---

## ✨ Features

### 게임 플레이
- **54장 덱**(52장 + 조커 2장)에서 매 라운드 카드 공개, **10라운드 / 라운드당 10초 타이머**
- 10개 슬롯에 전략적 배치 (배치 후 변경 불가)
- **12종 포커 조합** 판정 (로열 스트레이트 플러시 ~ 원페어)
- **인접 슬롯 규칙** — 모든 조합은 연속된 슬롯에서만 성립 (슬롯 순서가 곧 전략)
- **조커 와일드카드** — 총점이 가장 높아지는 조합에 자동 배정 (3가지 배분 전략을 비교해 최적값 선택)

### 게임 모드
- **싱글 모드** — 혼자 최고 점수에 도전
- **멀티플레이** — Socket.io 실시간 대전 (최대 10명)
  - 방 만들기 / 코드로 참여 / **공개 방 목록에서 찾기**
  - **라운드 동기화** — 전원이 배치를 완료해야 다음 라운드로 진행
  - **재접속 복구** — 새로고침·일시 끊김 시 진행 중이던 방/보드로 자동 복귀 (유예 시간 내)
  - **동점 처리** — 총점이 같으면 타이브레이커(조합에 쓰인 카드 숫자 합)로, 타이브레이커까지 같으면 **공동 순위**

### 랭킹 & 소셜
- **누적 랭킹** — 모든 게임 점수를 합산 (`user_rankings` DB 뷰)
- **리더보드** — 누적 점수 순위 + 각 유저의 **역대 최고 조합** 표시
- **티어 시스템** — 누적 점수로 Bronze → Diamond 5단계, 배지 + 다음 티어까지 진행도
- **친구** — 아이디로 친구 추가 / 요청 수락·거절 / 친구 목록(티어·누적점수)

### 사용자 경험
- **다국어(i18n)** — 한국어 / English, 브라우저 언어 자동 감지 + 수동 토글 (localStorage 저장)
- **사운드** — 배치·타이머 경고·결과·승리·클릭 합성 효과음 + 음소거 토글
- **가로모드 안내** — 세로 화면일 때 회전 안내 오버레이
- **결과 공유** — Web Share API(미지원 시 클립보드 복사)
- **로딩 표시** — 공용 Spinner + 방 생성/찾기·게임 시작·친구 액션·랭킹 스켈레톤
- **계정 관리** — 회원가입/로그인, 중복 로그인 시 기존 세션 강제 종료, **계정 삭제**(비밀번호 확인)
- 모바일 가로모드 우선 반응형, 게임 중 언제나 열 수 있는 **족보 모달**

### 신뢰성 / 보안
- **서버 권위 점수 계산(anti-cheat)** — 클라이언트가 보낸 점수를 믿지 않고, 서버가 보드를 재평가해 저장
- **DB 장애 graceful 처리** — 저장/조회 실패가 게임 플레이를 막지 않음 (타임아웃 + 조용한 폴백)
- **Row Level Security** — 랭킹 뷰는 서버 전용, 마이그레이션으로 RLS 잠금

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
| Database / Auth | Supabase (PostgreSQL) + bcryptjs | - |
| Server | 커스텀 Node 서버 (Next.js + Socket.io, `tsx`) | - |
| Mobile | Capacitor (iOS / Android 래퍼) | 8 |
| Analytics | Google Analytics + GTM | - |

---

## 📁 Project Structure

```
streams-poker/
├── server/                       # 커스텀 서버 (Next.js + Socket.io, tsx 실행)
│   ├── index.ts                  # HTTP 서버 + Socket.io 부트스트랩
│   ├── state.ts                  # 인메모리 방/세션 상태, 재접속 유예 타이머
│   ├── rounds.ts                 # 라운드 타이머/진행/완료 판정
│   ├── deck.ts                   # 서버측 덱 생성 + 방 코드
│   ├── scoring.ts                # 서버 권위 점수 재계산 (클라 evaluator 재사용)
│   └── handlers/                 # auth / room / game 소켓 핸들러
├── src/
│   ├── app/
│   │   ├── page.tsx              # 진입 → 로비 리다이렉트
│   │   ├── layout.tsx            # 루트 레이아웃 (GA/GTM, 글로벌 족보/가로모드)
│   │   ├── login|register/       # 인증 페이지
│   │   ├── lobby/                # 로비 (모드 선택·리더보드·친구·티어·설정)
│   │   ├── room/[roomId]/        # 멀티 대기방 (Ready 체크)
│   │   ├── game/[roomId]/        # 게임 화면 (single/multi)
│   │   ├── privacy/              # 개인정보처리방침
│   │   └── api/                  # auth, account/delete, leaderboard(+rank), friends(+request/requests/respond)
│   ├── components/
│   │   ├── game/                 # Board, Slot, Card, CurrentCard, Timer, RoundInfo, GameScreen, ResultScreen, Leaderboard, HandRankingsModal
│   │   ├── common/               # Logo, Spinner, LanguageToggle, MuteButton, OrientationGate, TierBadge, TierInfoModal, GlobalHandRankings, CapacitorBootstrap
│   │   ├── auth/                 # AuthForm, DeleteAccountModal
│   │   └── social/               # FriendsPanel
│   ├── stores/                   # Zustand: auth, game, room, settings, i18n
│   ├── lib/
│   │   ├── poker/                # deck.ts(셔플), evaluator.ts(조합 판정·조커·타이브레이커)
│   │   ├── i18n/                 # locales, useT, combo, messages/(네임스페이스별 ko/en)
│   │   ├── sound.ts · share.ts · tier.ts · friends.ts · leaderboard.ts
│   │   ├── socket.ts · supabase.ts · fetchWithTimeout.ts · comboStyles.ts
│   └── types/                    # card, game, room, auth, leaderboard
├── supabase/migrations/          # SQL 마이그레이션 (수동 실행)
├── deploy/home-server/           # 집 서버 + Cloudflare Tunnel 배포 가이드
└── docs/                         # 계획·한계·수익화 문서
```

### Zustand 스토어

| 스토어 | 역할 |
| --- | --- |
| `authStore` | 로그인/회원가입/탈퇴, 유저·세션 persist, 강제 로그아웃 |
| `gameStore` | 싱글/멀티 게임 상태(phase·slots·deck·timer·score), 재접속 스냅샷 |
| `roomStore` | 방 코드·플레이어·상태, 소켓 이벤트, 방 목록, 로딩 플래그 |
| `settingsStore` | 음소거 설정 (localStorage) |
| `i18nStore` | 현재 언어(ko/en), 자동 감지 + 저장 |

---

## 🏆 Scoring

| 조합 | 조건 (모두 인접 슬롯) | 점수 |
| --- | --- | --- |
| 로열 스트레이트 플러시 | 10-J-Q-K-A + 같은 문양 | 40 |
| 백 스트레이트 플러시 | A-2-3-4-5 + 같은 문양 | 30 |
| 스트레이트 플러시 | 연속 5장 + 같은 문양 | 25 |
| 포카드 | 같은 숫자 4장 | 21 |
| 풀하우스 | 트리플 + 페어 | 15 |
| 마운틴 | 10-J-Q-K-A | 14 |
| 백스트레이트 | A-2-3-4-5 | 12 |
| 플러시 | 같은 문양 5장 | 12 |
| 스트레이트 | 숫자 5장 연속 | 12 |
| 트리플 | 같은 숫자 3장 | 6 |
| 투페어 | 페어 2개 | 3 |
| 원페어 | 같은 숫자 2장 | 2 |

- **인접 규칙**: 모든 조합은 연속된 슬롯의 카드로만 성립합니다.
- **조커**: 총점이 최대가 되도록 자동 배정됩니다.
- **동점**: 총점 → 타이브레이커(조합 카드 숫자 합, A=14) → 그래도 같으면 공동 순위.

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
# 선택: 프로덕션 포트 (기본 3000)
PORT=3000
```

### 3. 데이터베이스

`users` / `leaderboard` 기본 테이블을 만든 뒤, `supabase/migrations/`의 SQL을 **번호 순서대로** Supabase SQL Editor에 붙여넣어 실행합니다.

| 파일 | 내용 |
| --- | --- |
| `0001_user_cumulative_ranking.sql` | leaderboard에 `user_id`/`mode` 추가, `user_rankings` 누적 뷰 생성 |
| `0002_friendships.sql` | 친구 관계 테이블(요청/수락) + 인덱스 |
| `0003_best_combo.sql` | `best_combo`/`best_combo_rank` 추가, 뷰에 최고 조합 반영 |
| `0004_lock_rls.sql` | RLS 활성화/정책 |
| `0005_lock_rls_fix.sql` | RLS 정책 보정 |
| `0006_lock_rankings_view.sql` | 랭킹 뷰 접근 잠금 |

> `users` 테이블은 비밀번호를 `password_hash`(bcrypt) 컬럼에 저장합니다.

### 4. 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 시작합니다. `npm run dev`는 커스텀 서버(`server/index.ts`)를 실행해 Next.js와 Socket.io를 함께 구동합니다.

> 집 PC + Cloudflare Tunnel로 외부에 HTTPS/WebSocket을 공개하는 방법은 [`deploy/home-server/`](deploy/home-server/) 를 참고하세요.

---

## 📜 Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (커스텀 서버 + Socket.io) |
| `npm run dev:next` | Next.js 개발 서버만 (Socket.io 없음) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

---

## 📄 License

MIT

---

*Built with Next.js, Socket.io, and Supabase*
