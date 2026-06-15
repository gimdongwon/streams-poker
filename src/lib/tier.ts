// 누적 점수(user_rankings.total_score) 기반 티어.
// 임계값/색은 여기 한 곳에서 조정한다. 플레이 데이터가 쌓이면 분포 보고 재조정 권장.

export type TierKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type Tier = {
  key: TierKey;
  label: string;
  min: number; // 이 티어가 시작되는 누적 점수
  color: string; // 배지 색 (다크 테마 메탈릭)
};

// 낮은 → 높은 순서
export const TIERS: Tier[] = [
  { key: "bronze", label: "Bronze", min: 0, color: "#cd7f32" },
  { key: "silver", label: "Silver", min: 100, color: "#c0c0c0" },
  { key: "gold", label: "Gold", min: 300, color: "#f5c518" },
  { key: "platinum", label: "Platinum", min: 700, color: "#5fe3c6" },
  { key: "diamond", label: "Diamond", min: 1500, color: "#6ec6ff" },
];

// 누적 점수에 해당하는 (가장 높은 충족) 티어 반환.
export const getTier = (totalScore: number): Tier => {
  let result = TIERS[0];
  for (const t of TIERS) {
    if (totalScore >= t.min) result = t;
    else break;
  }
  return result;
};

// 다음 티어까지 남은 점수(진행바용). 최고 티어면 null.
export const nextTier = (
  totalScore: number
): { next: Tier; remaining: number } | null => {
  const current = getTier(totalScore);
  const idx = TIERS.findIndex((t) => t.key === current.key);
  const next = TIERS[idx + 1];
  if (!next) return null;
  return { next, remaining: Math.max(0, next.min - totalScore) };
};
