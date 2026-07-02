-- ============================================================================
-- 0006_lock_rankings_view.sql
-- user_rankings 뷰의 anon/authenticated 직접 SELECT 권한 회수.
-- 이 뷰는 소유자 권한으로 실행돼 leaderboard RLS 를 우회하므로, 0001 에서 부여한
-- anon SELECT 권한이 남아 있으면 anon 키로 랭킹을 직접 읽을 수 있다.
-- 앱은 이 뷰를 서버 API(service_role) 경유로만 읽으므로 anon 직접 접근은 불필요.
-- (공개 리더보드 데이터라 민감하진 않지만, "anon 은 DB 에 직접 접근 불가" 원칙으로 통일)
-- ============================================================================

revoke select on public.user_rankings from anon, authenticated;

-- service_role 은 광범위 권한이라 영향 없음 → 서버 API 조회 계속 정상.
-- 검증: anon 키로 user_rankings SELECT 시 권한 거부/0행.
-- ============================================================================
