// 서버(소켓) 전용 코인 클라이언트.
// 주의: @/lib/supabase 는 `import "server-only"` 때문에 커스텀 Node 서버에서 못 쓴다.
// 여기서 service_role 클라이언트를 직접 만든다. (env 는 Next app.prepare 시 로드됨 → 지연 생성)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
const db = (): SupabaseClient => {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
};

export const getCoins = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await db()
      .from("users")
      .select("coins")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return 0;
    return data.coins ?? 0;
  } catch {
    return 0;
  }
};

// 원자적 차감. 잔액 부족/실패 시 -1.
export const deductCoins = async (
  userId: string,
  amount: number
): Promise<number> => {
  try {
    const { data, error } = await db().rpc("deduct_coins", {
      uid: userId,
      amount,
    });
    if (error) return -1;
    return Number(data);
  } catch {
    return -1;
  }
};

// 원자적 지급. 실패 시 -1.
export const addCoins = async (
  userId: string,
  amount: number
): Promise<number> => {
  try {
    const { data, error } = await db().rpc("add_coins", {
      uid: userId,
      amount,
    });
    if (error) return -1;
    return Number(data);
  } catch {
    return -1;
  }
};
