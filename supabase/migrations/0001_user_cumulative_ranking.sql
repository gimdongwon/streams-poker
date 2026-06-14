-- ============================================================================
-- 0001_user_cumulative_ranking.sql
-- 유저별 "누적 합산" 랭킹을 위한 스키마 변경.
--
-- 기존 leaderboard 테이블은 "게임 1판 = 행 1개"의 기록(history)으로 그대로 둔다.
-- 여기에 user_id / mode 를 붙이고, 유저별 점수 합계를 집계하는 뷰를 추가한다.
-- Supabase SQL Editor 에서 한 번 실행하면 된다. (idempotent)
-- ============================================================================

-- 1) 게임 기록을 유저와 연결 + 모드 기록
alter table public.leaderboard
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists mode text;

create index if not exists leaderboard_user_id_idx on public.leaderboard (user_id);
create index if not exists leaderboard_score_idx   on public.leaderboard (score desc);

-- 2) 유저별 누적 랭킹 뷰 (모든 게임 점수의 합)
--    - total_score : 모든 게임 점수 합 (랭킹 기준)
--    - games_played: 플레이한 게임 수
--    - best_score  : 단판 최고 점수
--    - nickname    : 가장 최근 게임의 닉네임
--    user_id 가 없는 과거(익명) 기록은 누적에서 제외된다.
create or replace view public.user_rankings as
select
  user_id,
  (array_agg(nickname order by played_at desc))[1] as nickname,
  sum(score)::bigint as total_score,
  count(*)::int      as games_played,
  max(score)::int    as best_score,
  max(played_at)     as last_played
from public.leaderboard
where user_id is not null
group by user_id;

-- 3) 뷰를 PostgREST(anon/authenticated)에서 읽을 수 있도록 권한 부여
grant select on public.user_rankings to anon, authenticated;

-- ============================================================================
-- 참고
-- - 누적 합산은 "많이 플레이할수록 점수가 쌓이는" 방식이다(요청사항). 추후 평균/
--   최고점/MMR 등으로 바꾸고 싶으면 이 뷰의 집계식만 교체하면 된다.
-- - 규모가 커지면 이 뷰를 materialized view 또는 증분 갱신 테이블로 승격할 수 있다.
-- ============================================================================
