-- ============================================================================
-- 0010_social_identity.sql
-- 네이티브 소셜 로그인(Apple/Google)으로 게스트를 정식 승격하기 위한 컬럼.
-- provider/provider_sub 로 소셜 identity 를 식별하고, 유니크 인덱스로 중복 링크를 막는다.
-- Supabase SQL Editor 에서 실행. (idempotent)
-- ============================================================================

alter table public.users
  add column if not exists provider text,        -- 'apple' | 'google'
  add column if not exists provider_sub text,     -- provider 고유 subject id
  add column if not exists email text;

-- 같은 소셜 identity 가 여러 계정에 붙지 않도록 (충돌 처리의 기준).
create unique index if not exists users_provider_sub_idx
  on public.users (provider, provider_sub)
  where provider is not null and provider_sub is not null;
-- ============================================================================
