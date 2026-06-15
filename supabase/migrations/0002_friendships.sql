-- ============================================================================
-- 0002_friendships.sql
-- 친구 기능: 친구 요청/수락 관계 저장.
-- username(아이디)로 상대를 찾아 요청 → 상대가 수락하면 accepted.
-- Supabase SQL Editor 에서 한 번 실행. (idempotent)
-- ============================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- 같은 두 사람 사이의 중복 관계 방지 (요청 방향 무관)
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);

-- 앱이 anon 키 기반이므로 기존 패턴대로 개방 (출시/광고 직전 service_role 전환 시 강화)
alter table public.friendships enable row level security;
drop policy if exists "anon friendships rw" on public.friendships;
create policy "anon friendships rw" on public.friendships
  for all to anon using (true) with check (true);

-- ============================================================================
-- 참고
-- - username 으로 상대를 조회해 requester_id/addressee_id 를 채운다.
-- - 친구 목록은 status='accepted' 인 양방향 관계를 조회한다.
-- ============================================================================
