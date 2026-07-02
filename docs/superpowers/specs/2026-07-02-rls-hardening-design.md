# #4 Supabase RLS 강화 (설계)

> 작성일: 2026-07-02
> 상위: [app-roadmap-design](2026-07-02-app-roadmap-design.md) ③ 출시 선행 작업
> 상태: **설계 — 구현은 승인 + 순서 준수 필요** (라이브 앱 대상이라 잘못하면 로그인/리더보드/친구 중단)

## 문제

모든 테이블에 `anon` 전면 read/write 정책이 열려 있다(마이그레이션 0002 주석에도 명시). anon 키는
`NEXT_PUBLIC_*` 라 공개값이므로, 이론상 누구나 anon 키로 DB를 직접 조작할 수 있다(유저/리더보드/친구 위조).

## 핵심 사실 (조사 결과 — 강화가 안전한 이유)

- **브라우저는 Supabase 에 직접 접근하지 않는다.** 클라이언트 컴포넌트(lobby, FriendsPanel)는 타입만
  import 하고, 데이터는 전부 **Next API 라우트 경유**(`fetchWithTimeout`)로 접근한다.
- **소켓 서버는 DB 미사용**(순수 인메모리).
- `src/lib/supabase.ts` 의 anon 클라이언트는 **서버측 API 라우트에서만** 쓰인다
  (auth/login·signup, leaderboard, leaderboard/rank, friends/*).

→ 따라서 **클라이언트 리팩터링 없이** 서버 키를 service_role 로 바꾸고 RLS 를 잠그면 된다.

## 설계

### 1. 서버 전용 service_role 클라이언트
- 새 서버 환경변수 **`SUPABASE_SERVICE_ROLE_KEY`** (절대 `NEXT_PUBLIC_` 아님 — 브라우저 노출 금지).
- `src/lib/supabase.ts` 를 service_role 키로 생성하도록 변경. service_role 은 RLS 를 우회한다.
- **유출 방지 가드**: 이 모듈 맨 위에 `import "server-only"` 추가 → 실수로 클라이언트 번들에 포함되면
  빌드가 실패하도록. (현재 클라 컴포넌트가 import 하지 않으므로 안전하지만, 회귀 방지)
- `NEXT_PUBLIC_SUPABASE_URL` 은 그대로 사용(공개 무방). `NEXT_PUBLIC_SUPABASE_ANON_KEY` 는
  더 이상 서버가 쓰지 않게 되며, 클라도 안 쓰므로 사실상 무력화된다.

### 2. RLS 정책 잠금 (마이그레이션 `0004_lock_rls.sql`)
- `friendships` 의 `anon` 전면 rw 정책 제거. `users`, `leaderboard` 도 anon 직접 접근 정책 제거/미부여.
- service_role 은 RLS 를 우회하므로 서버 API 는 계속 동작. anon 키로는 아무 것도 못 하게 된다.
- `user_rankings` 뷰의 anon SELECT 권한: 현재 클라가 직접 안 읽고 API 경유이므로 **회수 가능**.
  (혹시 후속에 공개 읽기가 필요하면 그때 선택적 재부여)

### 3. 배포 순서 (⚠️ 중요 — 어기면 라이브 중단)
1. Supabase 대시보드에서 **service_role 키 확인** → Railway 환경변수 `SUPABASE_SERVICE_ROLE_KEY` 설정.
2. **코드 변경(1) 배포** → 서버가 service_role 로 DB 접근하는지 확인(로그인/리더보드/친구 정상).
3. 그 다음 **마이그레이션(2) 적용**으로 anon 정책 제거. (순서 반대면 anon 기반 서버가 먼저 끊긴다)
4. anon 키로 직접 쓰기가 거부되는지 스모크 확인.

## 검증
- 배포 후: 회원가입/로그인/리더보드 조회/점수 저장/친구 요청·수락 전 기능 회귀 테스트.
- anon 키로 `users`/`leaderboard`/`friendships` 직접 insert 시 **거부**되는지 확인.

## 리스크
- 순서 위반 시 라이브 DB 접근 중단 → 반드시 "env → 코드배포 → 마이그레이션" 순.
- service_role 키 유출 시 전권 → 서버 env 로만 보관, 로그·클라 번들 노출 금지(`server-only` 가드).

## 미결정 (승인 필요)
- 이 강화를 **지금(스토어 출시 전) 실행**할지, 아니면 계정삭제 기능 등 다른 출시 선행작업과 함께 묶을지.
- 구현은 이 설계 승인 후 진행.
