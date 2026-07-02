// 서버 전용 모듈. 클라이언트 컴포넌트가 실수로 import 하면 빌드가 실패한다.
// (service_role 키는 RLS 를 우회하는 전권 키 — 절대 브라우저로 나가면 안 됨)
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// service_role: RLS 우회. NEXT_PUBLIC_ 아님 → 클라 번들에 인라인되지 않음. 서버 env 로만 주입.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
