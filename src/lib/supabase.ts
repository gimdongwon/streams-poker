// 서버 전용 모듈. 클라이언트 컴포넌트가 실수로 import 하면 빌드가 실패한다.
// (service_role 키는 RLS 를 우회하는 전권 키 — 절대 브라우저로 나가면 안 됨)
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 지연 초기화: createClient 를 모듈 로드 시점이 아니라 "첫 사용(런타임 요청)" 시점에 실행한다.
// next build 의 page-data 수집 단계에서 이 모듈이 평가되는데, 그때 service key 는 아직
// 없으므로(런타임 전용 secret) 모듈 로드 시 createClient 를 부르면 빌드가 실패한다.
// → Proxy 로 첫 속성 접근까지 생성을 미룬다. (호출부 supabase.from(...) 는 그대로)
let client: SupabaseClient | null = null;
const getClient = (): SupabaseClient => {
  if (!client) {
    // service_role: RLS 우회. NEXT_PUBLIC_ 아님 → 클라 번들 미포함, 런타임 서버 env 로만 주입.
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getClient();
    const value = Reflect.get(c as object, prop, receiver);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
