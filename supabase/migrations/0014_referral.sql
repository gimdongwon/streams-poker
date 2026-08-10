-- ============================================================================
-- 0014_referral.sql
-- 친구 초대 보상: 초대 링크(?ref=유저ID)로 가입한 정식 계정과 초대자 모두 +200 코인.
-- 어뷰징 방지: 정식 계정 전환 시에만 1회, 초대자당 최대 10명 보상.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

alter table public.users
  add column if not exists referred_by uuid references public.users(id) on delete set null;

create index if not exists idx_users_referred_by on public.users (referred_by);
