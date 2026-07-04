import { supabase } from "./supabase";

// KST(Asia/Seoul) 기준 오늘 날짜 (YYYY-MM-DD)
const kstToday = (): string =>
  new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export type CoinState = {
  coins: number;
  canClaimDaily: boolean;
};

// 잔액 + 오늘 일일보상 수령 가능 여부
export const getCoinState = async (userId: string): Promise<CoinState> => {
  const { data, error } = await supabase
    .from("users")
    .select("coins, last_daily_reward")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { coins: 0, canClaimDaily: false };

  const today = kstToday();
  const canClaimDaily =
    !data.last_daily_reward || String(data.last_daily_reward) < today;
  return { coins: data.coins ?? 0, canClaimDaily };
};

// 일일 보상 수령 (원자적 RPC). 이미 받았으면 claimed=false.
export const claimDaily = async (
  userId: string
): Promise<{ claimed: boolean; coins: number }> => {
  const { data, error } = await supabase.rpc("claim_daily_reward", {
    uid: userId,
  });
  if (error) throw error;
  const newbal = Number(data);
  if (newbal === -1) {
    const state = await getCoinState(userId);
    return { claimed: false, coins: state.coins };
  }
  return { claimed: true, coins: newbal };
};

// 판돈 차감 (원자적). 잔액 부족이면 -1 반환.
export const deductCoins = async (
  userId: string,
  amount: number
): Promise<number> => {
  const { data, error } = await supabase.rpc("deduct_coins", {
    uid: userId,
    amount,
  });
  if (error) throw error;
  return Number(data);
};

// 상금 지급 (원자적). 지급 후 잔액 반환.
export const addCoins = async (
  userId: string,
  amount: number
): Promise<number> => {
  const { data, error } = await supabase.rpc("add_coins", {
    uid: userId,
    amount,
  });
  if (error) throw error;
  return Number(data);
};
