-- ============================================================================
-- 0008_push_tokens.sql
-- 푸시 알림 토큰 저장. (Capacitor 네이티브 앱에서 발급한 APNs/FCM 토큰)
-- 친구 요청 등 서버발 알림 발송에 사용.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
-- service_role(서버)만 접근. anon 정책은 두지 않음.
