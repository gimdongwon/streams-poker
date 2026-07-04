-- ============================================================================
-- 0007_coins.sql
-- 코인(가상 화폐) 시스템. 일일 보상 + 판돈 멀티용.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
--
-- - coins: 보유 코인 (신규/기존 유저 기본 500)
-- - last_daily_reward: 마지막 일일 보상 수령일 (KST 기준 date)
-- 원자적 함수로 동시성(더블클릭/동시 정산) 안전하게 처리한다.
-- ============================================================================

alter table public.users
  add column if not exists coins integer not null default 500,
  add column if not exists last_daily_reward date;

-- 일일 보상 수령: 오늘(KST) 미수령이면 +100 하고 새 잔액 반환, 이미 받았으면 -1.
create or replace function public.claim_daily_reward(uid uuid)
returns integer
language plpgsql
as $$
declare
  newbal integer;
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  update public.users
    set coins = coins + 100,
        last_daily_reward = today
    where id = uid
      and (last_daily_reward is null or last_daily_reward < today)
    returning coins into newbal;

  if newbal is null then
    return -1; -- 오늘 이미 수령했거나 유저 없음
  end if;
  return newbal;
end;
$$;

-- 판돈 차감: 잔액이 충분하면 차감 후 새 잔액 반환, 부족하면 -1.
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
    return -1; -- 잔액 부족 또는 유저 없음
  end if;
  return newbal;
end;
$$;

-- 상금 지급: 코인 추가 후 새 잔액 반환.
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
  return coalesce(newbal, -1);
end;
$$;

-- 서버(service_role)만 호출. (service_role 은 기본적으로 실행 가능하지만 명시)
grant execute on function public.claim_daily_reward(uuid) to service_role;
grant execute on function public.deduct_coins(uuid, integer) to service_role;
grant execute on function public.add_coins(uuid, integer) to service_role;
