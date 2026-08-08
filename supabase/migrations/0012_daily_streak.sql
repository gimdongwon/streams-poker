-- ============================================================================
-- 0012_daily_streak.sql
-- 연속 출석 스트릭: 일일 보상을 연속 수령일에 따라 증액.
-- 보상: 1일 100 → 매일 +20 (2일 120 … 6일 200) → 7일 이상 300.
-- 어제 수령하지 않았으면 스트릭은 1일차로 리셋.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

alter table public.users
  add column if not exists daily_streak integer not null default 0;

-- v2: 스트릭 계산 + 가변 보상. jsonb 반환 {claimed, coins, reward, streak}
create or replace function public.claim_daily_reward_v2(uid uuid)
returns jsonb
language plpgsql
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  yest date := (now() at time zone 'Asia/Seoul')::date - 1;
  cur record;
  new_streak integer;
  reward integer;
  newbal integer;
begin
  select coins, last_daily_reward, daily_streak into cur
    from public.users where id = uid
    for update;

  if cur is null then
    return jsonb_build_object('claimed', false);
  end if;

  -- 오늘 이미 수령
  if cur.last_daily_reward is not null and cur.last_daily_reward >= today then
    return jsonb_build_object(
      'claimed', false, 'coins', cur.coins, 'streak', coalesce(cur.daily_streak, 0)
    );
  end if;

  -- 어제 수령했으면 스트릭 연장, 아니면 1일차
  if cur.last_daily_reward = yest then
    new_streak := coalesce(cur.daily_streak, 0) + 1;
  else
    new_streak := 1;
  end if;

  reward := case when new_streak >= 7 then 300 else 100 + (new_streak - 1) * 20 end;

  update public.users
    set coins = coins + reward,
        last_daily_reward = today,
        daily_streak = new_streak
    where id = uid
    returning coins into newbal;

  return jsonb_build_object(
    'claimed', true, 'coins', newbal, 'reward', reward, 'streak', new_streak
  );
end;
$$;

grant execute on function public.claim_daily_reward_v2(uuid) to service_role;
