-- ============================================================================
-- 0009_guest_users.sql
-- 익명(게스트) 유저 지원. 앱 부팅 시 게스트 users 행을 만들어 싱글 전적을 쌓고,
-- 멀티 입구에서 같은 users.id 를 유지한 채 정식 계정으로 승격한다(전적 자동 승계).
-- Supabase SQL Editor 에서 실행. (idempotent)
-- ============================================================================

-- 게스트 표시 컬럼
alter table public.users
  add column if not exists is_guest boolean not null default false;

-- 게스트는 비밀번호가 없으므로 password_hash 를 nullable 로 (이미 nullable 이면 무해).
alter table public.users alter column password_hash drop not null;

-- 랭킹 뷰: 게스트 제외(승격 후에만 노출). 게스트가 정식 전환되면 과거 싱글 기록도 자동 반영.
drop view if exists public.user_rankings;
create view public.user_rankings as
select
  l.user_id,
  (array_agg(l.nickname order by l.played_at desc))[1] as nickname,
  sum(l.score)::bigint as total_score,
  count(*)::int        as games_played,
  max(l.score)::int    as best_score,
  (array_agg(l.best_combo order by l.best_combo_rank asc nulls last))[1] as best_combo,
  max(l.played_at)     as last_played
from public.leaderboard l
join public.users u on u.id = l.user_id
where l.user_id is not null and u.is_guest = false
group by l.user_id;

-- anon 직접 접근은 계속 차단(0006 원칙 유지) → 재grant 하지 않는다. service_role 만 접근.
-- ============================================================================
