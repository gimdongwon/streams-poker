# TENTENS — 티어 & 친구 기능 실행 계획

> 결정 반영:
> - 티어: 누적 점수(user_rankings.total_score) 기준 **Bronze→Diamond 5단계**. 임계값은 한 곳(config)에서 조정 가능.
> - 친구: **username(아이디)로 추가**. 친구 초대(방으로)·온라인 presence는 **후순위(이번 제외)**.
> - 각 단계 끝마다 tsc + 빌드 검증, 기능 단위 커밋.

---

## Phase A — 티어 (DB 변경 없음, 빠름)

누적 점수는 이미 `user_rankings` 뷰 + `/api/leaderboard/rank`(rankInfo)로 클라가 받고 있음 → 티어는 그 값에서 **파생**만 하면 됨. 스키마/마이그레이션 불필요.

### A-1. 티어 정의 (config + 헬퍼)
- 신규 `src/lib/tier.ts`:
  - `TIERS` 배열(낮은→높은): 각 항목 `{ key, label, min, color, glow }`.
  - 초기 임계값(누적 점수, **튜닝 가능** — 한 곳에서 수정):
    - Bronze `0`, Silver `100`, Gold `300`, Platinum `700`, Diamond `1500`
  - 색(다크 테마에 맞춘 메탈릭): Bronze `#cd7f32`, Silver `#c0c0c0`, Gold `#f5c518`, Platinum `#5fe3c6`, Diamond `#6ec6ff`(시안 계열).
  - `getTier(totalScore) → Tier` (가장 높은 충족 구간 반환), `nextTier(totalScore) → {next, remaining} | null`(다음 티어까지 남은 점수, 진행바용).
- 순수 함수라 서버/클라 공용 가능.

### A-2. TierBadge 컴포넌트
- 신규 `src/components/common/TierBadge.tsx`: `tier`(또는 `totalScore`)와 `size` 받아 색 배지 + 라벨. 작은/큰 사이즈.

### A-3. 노출 위치 (누적 기반이므로 누적이 보이는 곳)
- **로비 헤더**: 기존 "내 랭킹/누적점수/판수" 옆에 티어 배지(+다음 티어까지 진행 표시 선택).
- **리더보드 행**: 각 유저 `total_score` → 티어 배지(닉네임 옆 작은 배지).
- (결과 화면은 "이번 게임만" 원칙이라 티어는 넣지 않음 — 일관성 유지. 원하면 추후.)
- **파일**: 수정 `src/app/lobby/page.tsx`, `src/components/game/Leaderboard.tsx`.

**A 검증**: tsc + 빌드. 티어 경계값(99/100 등) 표시 확인.

---

## Phase B — 친구 (username 기반, 마이그레이션 필요)

### B-1. DB 마이그레이션 `supabase/migrations/0002_friendships.sql`
```sql
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- 같은 쌍의 중복 요청 방지 (방향 무관 유니크)
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);

alter table public.friendships enable row level security;
create policy "anon friendships rw" on public.friendships
  for all to anon using (true) with check (true);
```
> 앱이 anon 키 기반이라 RLS는 기존 패턴대로 개방. (정석 강화는 광고/출시 직전 service_role 전환 때 함께)

### B-2. lib + API
- `src/lib/friends.ts`(supabase 쿼리):
  - `findUserByUsername(username)` → `{id, username, nickname}` | null
  - `sendFriendRequest(requesterId, addresseeId)` (자기 자신/중복/이미 친구 가드)
  - `respondFriendRequest(friendshipId, userId, accept)` (addressee만, accept→status accepted+responded_at, 거절→삭제)
  - `listFriends(userId)` → 수락된 친구들 `{user_id, username, nickname, total_score}`(랭킹 뷰 조인으로 티어용 점수 포함)
  - `listIncomingRequests(userId)` → 받은 pending `{friendshipId, requester{username,nickname}}`
  - `removeFriend(friendshipId, userId)` (선택)
- API 라우트(`src/app/api/friends/...`):
  - `POST /api/friends/request` `{ userId, username }` → 대상 조회 후 요청 생성. 없는 아이디/자기자신/중복 → 4xx 메시지.
  - `GET  /api/friends?userId=` → 친구 목록(+total_score→티어)
  - `GET  /api/friends/requests?userId=` → 받은 요청
  - `POST /api/friends/respond` `{ friendshipId, userId, accept }`
  - `DELETE /api/friends` `{ friendshipId, userId }` (선택)
  - 모든 fetch는 `fetchWithTimeout` 사용(DB graceful 일관).

### B-3. 클라이언트 UI
- 친구 패널(로비에서 열리는 모달 또는 뷰):
  - **친구 추가**: 아이디 입력 → 요청 보내기(성공/실패 토스트: "없는 아이디", "이미 친구", "요청 보냄").
  - **받은 요청**: 수락/거절 버튼 + 뱃지(개수).
  - **친구 목록**: 닉네임 + 아이디 + **티어 배지**(B는 A의 TierBadge 재사용) + 누적점수.
- 진입점: 로비 헤더/유저 메뉴에 "친구" 버튼(요청 개수 뱃지).
- 상태 관리: 가벼우니 컴포넌트 로컬 state + fetch로 충분(전역 store 불필요). 필요 시 `friendsStore` 추가.
- **파일**: 신규 `src/components/social/FriendsPanel.tsx`(또는 분할), 수정 `src/app/lobby/page.tsx`(진입점).

**B 검증**: tsc + 빌드. 마이그레이션 실행 후 요청→수락→목록 플로우 수동 확인(2계정).

---

## 실행 순서
1. **Phase A (티어)** — 마이그레이션 없이 바로. 커밋 1~2개(`tier.ts`+badge, 노출).
2. **Phase B (친구)** — `0002_friendships.sql` 제공(여러분이 Supabase에서 실행) → lib/API → UI. 커밋 단위 분리.

## 후순위(이번 제외)
- 친구를 현재 방으로 초대(딥링크/코드 공유), 온라인·게임중 presence(소켓), 친구 전용 리더보드.

## 참고
- 티어 임계값은 `tier.ts` 한 곳에서 조정. 플레이 데이터 쌓이면 분포 보고 재조정 권장.
- 친구 조회를 username으로 하므로, username은 노출 식별자가 됨(닉네임과 분리 유지한 이유와 일치).
