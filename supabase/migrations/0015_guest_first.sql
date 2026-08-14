-- ============================================================================
-- 0015_guest_first.sql
-- 게스트 중심 모델 전환: 게스트도 랭킹에 포함한다.
-- (계정 백업(소셜 연동)은 기록 보존용 옵션으로 역할 변경 — 랭킹 노출 조건 아님)
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

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
where l.user_id is not null
group by l.user_id;

-- anon 직접 접근은 계속 차단(0006 원칙 유지). service_role 만 접근.
