# 🃏 TENTENS

> 10라운드 전략 카드 배치 게임 — 같은 카드, 다른 전략으로 승부하라!

모든 플레이어에게 동일한 10장의 카드가 주어지고, 매 라운드 공개되는 카드를 10개 슬롯에 전략적으로 배치하여 포커 조합 점수를 겨루는 실시간 멀티플레이 웹 게임입니다.

## 📸 Screenshots

> TODO: 게임 스크린샷 추가

## ✨ Features

### 게임 플레이
- **54장 덱** (52장 + 조커 2장)에서 랜덤 10장 추출
- **10라운드** 진행, 라운드당 **10초 타이머**
- 10개 슬롯에 전략적 카드 배치 (배치 후 변경 불가)
- **조커 와일드카드** — 최고 점수를 만드는 조합에 자동 할당
- 12종 포커 조합 판정 (로열 스트레이트 플러시 ~ 원페어)
- **인접 슬롯 규칙** — 모든 조합(페어, 플러시 포함)은 인접한 슬롯에서만 성립

### 멀티플레이
- **Socket.io 기반 실시간 대전** (최대 10명)
- 방 코드로 생성/참여
- **라운드 동기화** — 모든 플레이어가 배치 완료해야 다음 라운드 진행
- 배치 대기 중 플레이어 상태 실시간 표시
- **동점 타이브레이커** — 같은 점수일 때 조합 카드의 숫자 합으로 승부

### 기타
- 싱글 모드 (혼자 연습)
- Supabase 기반 글로벌 리더보드 (Top 10)
- 간단한 회원가입/로그인 시스템
- 동시 접속 세션 관리 (중복 로그인 시 기존 세션 강제 로그아웃)
- 모바일 가로모드 우선 반응형 디자인
- 족보(핸드 랭킹) 모달 — 게임 중 언제든 확인 가능

## 🛠 Tech Stack

| 분류 | 기술 | 버전 |
| --- | --- | --- |
| **Framework** | Next.js (App Router) | 16 |
| **Language** | TypeScript | 5 |
| **Runtime** | React | 19 |
| **Styling** | TailwindCSS | 4 |
| **State** | Zustand | 5 |
| **Animation** | Framer Motion | 12 |
| **Realtime** | Socket.io | 4.8 |
| **Database** | Supabase (PostgreSQL) | - |
| **Auth** | bcryptjs (커스텀 인증) | 3 |
| **Server** | Custom Next.js Server (tsx) | - |

## 📁 Project Structure

```
streams-poker/
├── server/                            # 커스텀 서버 (Next.js + Socket.io, tsx 실행)
│   ├── index.ts                       # HTTP 서버 + Socket.io 부트스트랩
│   ├── state.ts                       # 인메모리 방/세션 상태
│   ├── rounds.ts                      # 라운드 타이머/진행
│   ├── deck.ts                        # 서버측 덱 생성/방 코드
│   ├── scoring.ts                     # 서버 권위 점수 재계산 (클라 evaluator 재사용)
│   └── handlers/                      # auth / room / game 소켓 핸들러
├── src/
│   ├── app/
│   │   ├── page.tsx                   # / → /lobby 리다이렉트
│   │   ├── layout.tsx                 # 루트 레이아웃 (글로벌 족보 버튼 포함)
│   │   ├── login/page.tsx             # 로그인 페이지
│   │   ├── register/page.tsx          # 회원가입 페이지
│   │   ├── lobby/page.tsx             # 로비 (모드 선택, 리더보드)
│   │   ├── room/[roomId]/page.tsx     # 멀티플레이 대기방
│   │   ├── game/[roomId]/page.tsx     # 게임 화면 (single/multi)
│   │   └── api/
│   │       ├── auth/                  # 로그인/회원가입 API
│   │       └── leaderboard/           # 리더보드 API
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameScreen.tsx         # 게임 메인 화면 (플레이 + 결과 분기)
│   │   │   ├── Card.tsx               # 카드 UI
│   │   │   ├── Slot.tsx               # 슬롯 UI (하이라이트 지원)
│   │   │   ├── Board.tsx              # 10슬롯 보드
│   │   │   ├── CurrentCard.tsx        # 현재 라운드 카드
│   │   │   ├── Timer.tsx              # 10초 타이머
│   │   │   ├── RoundInfo.tsx          # 라운드 정보
│   │   │   ├── ScoreBoard.tsx         # 결과 (조합 목록 + 점수)
│   │   │   ├── MultiResultBoard.tsx   # 멀티 전체 순위표
│   │   │   ├── Leaderboard.tsx        # 글로벌 리더보드
│   │   │   └── HandRankingsModal.tsx  # 족보 모달
│   │   ├── common/
│   │   │   ├── GlobalHandRankings.tsx # 글로벌 족보 버튼
│   │   │   └── Logo.tsx               # 로고 컴포넌트
│   │   └── auth/
│   │       └── AuthForm.tsx           # 로그인/회원가입 폼
│   ├── stores/
│   │   ├── gameStore.ts               # 게임 상태 (phase, rounds, slots, score)
│   │   ├── roomStore.ts               # 방 상태 (players, socket 이벤트)
│   │   └── authStore.ts               # 인증 상태 (user, session persist)
│   ├── lib/
│   │   ├── poker/
│   │   │   ├── deck.ts                # 덱 생성/셔플
│   │   │   └── evaluator.ts           # 조합 판정 엔진 (인접 규칙, 조커, 타이브레이커)
│   │   ├── socket.ts                  # Socket.io 클라이언트
│   │   ├── supabase.ts                # Supabase 클라이언트
│   │   └── leaderboard.ts             # 리더보드 유틸
│   └── types/
│       ├── card.ts                    # Card, Suit, Rank, JokerCard
│       ├── game.ts                    # GamePhase, Slot, CombinationType
│       ├── room.ts                    # Player, Room, RoomStatus
│       ├── auth.ts                    # User, AuthState
│       ├── leaderboard.ts             # LeaderboardEntry
│       └── index.ts                   # re-export
└── homework/                          # 일별 작업 일지
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase 프로젝트 (리더보드 & 인증용)

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/streams-poker.git
cd streams-poker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase 테이블 생성

Supabase SQL Editor에서 아래 쿼리를 실행:

```sql
-- 리더보드 테이블
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  combinations TEXT[] NOT NULL,
  combination_count INTEGER NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leaderboard_score ON leaderboard (score DESC);

-- 유저 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  password TEXT NOT NULL,
  session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 게임이 시작됩니다.

> **참고**: `npm run dev`(내부적으로 `tsx server/index.ts`)는 커스텀 서버(`server/`)를 실행하여 Next.js와 Socket.io를 동시에 구동합니다. 이 프로젝트는 `yarn`을 패키지 매니저로 사용합니다.

### 집 서버로 외부 공개 (비용 절감)

Railway 등 유료/트라이얼 없이 **집 PC + Cloudflare Tunnel** 로 HTTPS·WebSocket을 노출할 수 있습니다. 단계별 가이드·systemd 예시는 [`deploy/home-server/README.md`](deploy/home-server/README.md) 를 참고하세요.

## 🎮 How to Play

### 싱글 모드
1. 회원가입 후 로그인
2. 로비에서 **싱글 모드** 선택
3. 매 라운드 공개되는 카드를 원하는 슬롯에 배치 (10초 제한)
4. 10라운드 후 포커 조합 점수 확인
5. 점수가 리더보드에 자동 기록

### 멀티플레이
1. 로비에서 **멀티플레이** → **방 만들기** 또는 **방 참여하기**
2. 대기방에서 모든 플레이어 Ready → 방장이 게임 시작
3. 모든 플레이어에게 동일한 카드가 공개됨
4. 각 라운드마다 모든 플레이어가 배치를 완료해야 다음 라운드로 진행
5. 10라운드 종료 후 전체 순위 확인

## 🏆 Scoring

| 조합 | 조건 | 점수 |
| --- | --- | --- |
| 로열 스트레이트 플러시 | 10-J-Q-K-A + 같은 문양 (인접 5칸) | 40점 |
| 백 스트레이트 플러시 | A-2-3-4-5 + 같은 문양 (인접 5칸) | 30점 |
| 스트레이트 플러시 | 연속 5장 + 같은 문양 (인접 5칸) | 25점 |
| 포카드 | 동일 숫자 4장 (인접 4칸) | 21점 |
| 풀하우스 | 트리플 + 페어 (각각 인접) | 15점 |
| 마운틴 | 10-J-Q-K-A (인접 5칸) | 14점 |
| 백스트레이트 | A-2-3-4-5 (인접 5칸) | 12점 |
| 플러시 | 같은 문양 5장 (인접 5칸) | 12점 |
| 스트레이트 | 숫자 5장 연속 (인접 5칸) | 9점 |
| 트리플 | 같은 숫자 3장 (인접 3칸) | 6점 |
| 투페어 | 페어 2개 (각각 인접) | 3점 |
| 원페어 | 같은 숫자 2장 (인접 2칸) | 2점 |

> 모든 조합은 **인접한 슬롯**에 배치된 카드로만 성립합니다.

## 📜 Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (커스텀 서버 + Socket.io) |
| `npm run dev:next` | Next.js 개발 서버만 실행 (Socket.io 없음) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

## 📄 License

MIT

---

*Built with Next.js, Socket.io, and Supabase*
