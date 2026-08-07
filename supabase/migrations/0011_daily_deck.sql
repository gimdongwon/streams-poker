-- ============================================================================
-- 0011_daily_deck.sql
-- 오늘의 덱 (데일리 챌린지): 매일 같은 덱으로 1회 도전, 그날의 랭킹 경쟁.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
--
-- - 시작 시 행 생성(도전 소진), 제출 시 score/slots 기록.
-- - UNIQUE(user_id, date) 가 "1일 1회"의 근거.
-- - 날짜는 KST 기준 (API 서버에서 계산해 넘긴다).
-- ============================================================================

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  score integer,
  slots jsonb,
  combos text[],
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (user_id, date)
);

create index if not exists idx_daily_scores_date_score
  on public.daily_scores (date, score desc);

-- RLS: 서버(service role)만 접근. (기존 테이블들과 동일한 잠금 정책)
alter table public.daily_scores enable row level security;
