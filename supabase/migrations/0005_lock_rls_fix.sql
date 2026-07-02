-- ============================================================================
-- 0005_lock_rls_fix.sql
-- 0004 보정: users / leaderboard 에 (마이그레이션에 없던) 수동 생성 anon 개방 정책이
-- 남아 있어 anon 직접 접근이 계속 허용됐다. enable RLS 만으로는 기존 정책이 안 지워진다.
-- → 두 테이블의 "모든 정책"을 제거하고 RLS 를 보장한다. (정책 없음 = anon 거부, service_role 우회)
--
-- ⚠️ 서버가 service_role 로 접근하도록 배포된 뒤에 실행할 것 (0004 와 동일 전제).
-- ============================================================================

-- users / leaderboard 의 기존 정책 전부 제거 (이름을 몰라도 안전하게)
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('users', 'leaderboard')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- RLS 보장 (이미 켜져 있으면 no-op). 정책이 없으므로 anon/authenticated 전면 거부.
alter table public.users enable row level security;
alter table public.leaderboard enable row level security;

-- ============================================================================
-- 검증(스모크): anon 키로
--   - leaderboard INSERT → 거부
--   - users SELECT(id 등) → 0행
--   - user_rankings READ → 0행 (leaderboard RLS 로 뷰도 잠김)
-- 서버 API 는 service_role 이라 정상 동작한다.
-- ============================================================================
