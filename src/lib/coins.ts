import { supabase } from "./supabase";

// KST(Asia/Seoul) 기준 오늘 날짜 (YYYY-MM-DD)
const kstToday = (): string =>
  new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// KST 기준 어제 날짜
const kstYesterday = (): string =>
  new Date(Date.now() + 9 * 3600 * 1000 - 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

// 연속 출석 보상 곡선: 1일 100 → 매일 +20 → 7일 이상 300.
// (SQL 함수 claim_daily_reward_v2 와 반드시 일치해야 한다)
export const rewardForStreak = (streak: number): number =>
  streak >= 7 ? 300 : 100 + (streak - 1) * 20;

export type CoinState = {
  coins: number;
  canClaimDaily: boolean;
  // 현재 스트릭 (오늘 수령 완료 기준). 미수령 상태면 지금까지의 스트릭.
  streak: number;
  // 지금 받으면 얼마인지 (수령 완료면 null)
  nextReward: number | null;
  // 지금 받으면 몇 일차인지 (수령 완료면 null)
  nextStreak: number | null;
};

// 잔액 + 오늘 일일보상 수령 가능 여부 + 스트릭
export const getCoinState = async (userId: string): Promise<CoinState> => {
  const { data, error } = await supabase
    .from("users")
    .select("coins, last_daily_reward, daily_streak")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data)
    return { coins: 0, canClaimDaily: false, streak: 0, nextReward: null, nextStreak: null };

  const today = kstToday();
  const last = data.last_daily_reward ? String(data.last_daily_reward) : null;
  const streak = data.daily_streak ?? 0;
  const canClaimDaily = !last || last < today;

  // 다음 수령 시 스트릭: 어제 받았으면 +1, 아니면 1일차부터
  const nextStreak = last === kstYesterday() ? streak + 1 : 1;
  return {
    coins: data.coins ?? 0,
    canClaimDaily,
    streak,
    nextReward: canClaimDaily ? rewardForStreak(nextStreak) : null,
    nextStreak: canClaimDaily ? nextStreak : null,
  };
};

export type ClaimResult = {
  claimed: boolean;
  coins: number;
  reward?: number;
  streak?: number;
};

// 일일 보상 수령 (원자적 RPC v2 — 스트릭 반영). 이미 받았으면 claimed=false.
export const claimDaily = async (userId: string): Promise<ClaimResult> => {
  const { data, error } = await supabase.rpc("claim_daily_reward_v2", {
    uid: userId,
  });
  if (error) throw error;
  const r = data as {
    claimed: boolean;
    coins?: number;
    reward?: number;
    streak?: number;
  };
  return {
    claimed: Boolean(r?.claimed),
    coins: r?.coins ?? 0,
    reward: r?.reward,
    streak: r?.streak,
  };
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
