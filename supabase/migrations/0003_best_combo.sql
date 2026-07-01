-- ============================================================================
-- 0003_best_combo.sql
-- 리더보드에 유저별 "최고 조합"(그동안 만든 가장 높은 등급 조합)을 노출하기 위해
-- 게임 기록에 그 판의 최고 조합(이름 + 등급)을 저장하고, 뷰에서 유저별 최고를 뽑는다.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
--
-- best_combo_rank: 조합 등급(작을수록 강함, 1=로열 스트레이트 플러시 … 12=원페어). 조합 없으면 null.
-- best_combo:      해당 조합 이름(표시용).
-- ============================================================================

alter table public.leaderboard
  add column if not exists best_combo text,
  add column if not exists best_combo_rank int;

-- 유저별 누적 랭킹 뷰 재생성 (컬럼 순서 변경 때문에 DROP 후 재생성)
drop view if exists public.user_rankings;
create view public.user_rankings as
select
  user_id,
  (array_agg(nickname order by played_at desc))[1] as nickname,
  sum(score)::bigint as total_score,
  count(*)::int      as games_played,
  max(score)::int    as best_score,
  -- 등급이 가장 높은(rank 작은) 게임의 조합 이름을 최고 조합으로 선택
  (array_agg(best_combo order by best_combo_rank asc nulls last))[1] as best_combo,
  max(played_at)     as last_played
from public.leaderboard
where user_id is not null
group by user_id;

grant select on public.user_rankings to anon, authenticated;

-- 참고: 기존(과거) 기록은 best_combo가 null 이라 최고 조합이 안 뜰 수 있다.
-- 새 게임부터 정상 기록된다.
