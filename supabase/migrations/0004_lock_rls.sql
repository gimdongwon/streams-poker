-- ============================================================================
-- 0004_lock_rls.sql
-- anon 전면 개방 RLS 를 잠근다. 이제 서버는 service_role 키로 접근하므로(RLS 우회)
-- anon 키로는 어떤 테이블도 직접 읽고/쓸 수 없게 만든다.
--
-- ⚠️ 실행 순서 (반드시 지킬 것):
--   1) Railway 등 서버 env 에 SUPABASE_SERVICE_ROLE_KEY 설정  ← 완료
--   2) service_role 사용 코드(src/lib/supabase.ts) 배포 + 정상 동작 확인
--   3) 그 다음에 이 마이그레이션을 Supabase SQL Editor 에서 실행
--   (2 전에 이걸 먼저 실행하면 anon 기반 라이브 앱이 즉시 끊긴다)
--
-- 원리: RLS 활성화 + 정책 없음 → anon/authenticated 거부. service_role 은 RLS 를 우회한다.
-- ============================================================================

-- users: 비밀번호 해시가 있으므로 anon 직접 접근 완전 차단.
alter table public.users enable row level security;

-- leaderboard: 모든 접근을 서버(service_role) 경유로. anon 직접 쓰기(점수 위조) 차단.
alter table public.leaderboard enable row level security;

-- friendships: 0002 의 anon 전면 rw 정책 제거 (RLS 는 이미 켜져 있음 → 정책 없으면 anon 거부).
drop policy if exists "anon friendships rw" on public.friendships;

-- ============================================================================
-- 참고
-- - user_rankings 뷰는 leaderboard 를 읽으므로, leaderboard RLS 활성화로 anon 조회 시 빈 결과가 된다.
--   서버 API 는 service_role 로 조회하므로 정상. (뷰 grant 는 건드리지 않아도 사실상 잠긴다)
-- - 되돌리기(롤백): 이 파일의 alter 를 disable 로, drop policy 대신 0002 의 정책을 재생성.
-- - 스모크: anon 키로 users/leaderboard/friendships 직접 insert 시 거부되는지 확인.
-- ============================================================================
