-- ============================================================================
-- 0016_coin_log.sql
-- 코인 증감 이력. "오늘 획득한 코인" 통계용.
-- 모든 지급/차감이 RPC(add_coins/deduct_coins/claim_daily_reward_v2)를 거치므로
-- 그 안에서 로그를 남긴다. Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

create table if not exists public.coin_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null, -- 지급 양수 / 차감 음수
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists coin_log_user_created_idx
  on public.coin_log (user_id, created_at desc);

-- 클라이언트 직접 접근 차단 (service_role 은 RLS 우회)
alter table public.coin_log enable row level security;

-- 지급: 코인 추가 후 새 잔액 반환 + 로그.
create or replace function public.add_coins(uid uuid, amount integer)
returns integer
language plpgsql
as $$
declare
  newbal integer;
begin
  update public.users
    set coins = coins + greatest(amount, 0)
    where id = uid
    returning coins into newbal;
  if newbal is not null and amount > 0 then
    insert into public.coin_log (user_id, amount, reason) values (uid, amount, 'add');
  end if;
  return coalesce(newbal, -1);
end;
$$;

-- 차감: 잔액이 충분하면 차감 후 새 잔액 반환 + 로그, 부족하면 -1.
create or replace function public.deduct_coins(uid uuid, amount integer)
returns integer
language plpgsql
as $$
declare
  newbal integer;
begin
  if amount <= 0 then
    select coins into newbal from public.users where id = uid;
    return coalesce(newbal, -1);
  end if;
  update public.users
    set coins = coins - amount
    where id = uid and coins >= amount
    returning coins into newbal;
  if newbal is null then
    return -1;
  end if;
  insert into public.coin_log (user_id, amount, reason) values (uid, -amount, 'deduct');
  return newbal;
end;
$$;

-- 일일 보상 v2: 기존 로직 그대로 + 로그.
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

  if cur.last_daily_reward is not null and cur.last_daily_reward >= today then
    return jsonb_build_object(
      'claimed', false, 'coins', cur.coins, 'streak', coalesce(cur.daily_streak, 0)
    );
  end if;

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

  insert into public.coin_log (user_id, amount, reason) values (uid, reward, 'daily_reward');

  return jsonb_build_object(
    'claimed', true, 'coins', newbal, 'reward', reward, 'streak', new_streak
  );
end;
$$;

grant execute on function public.add_coins(uuid, integer) to service_role;
grant execute on function public.deduct_coins(uuid, integer) to service_role;
grant execute on function public.claim_daily_reward_v2(uuid) to service_role;
