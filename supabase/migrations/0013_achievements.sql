-- ============================================================================
-- 0013_achievements.sql
-- 업적(뱃지) 시스템: 달성 시 코인 보상 지급.
-- 업적 정의·판정은 서버 코드(src/lib/achievements.ts)에 있고,
-- DB 에는 달성 기록만 저장한다.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_id text not null,
  reward integer not null default 0,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user
  on public.user_achievements (user_id);

-- RLS: 서버(service role)만 접근.
alter table public.user_achievements enable row level security;
