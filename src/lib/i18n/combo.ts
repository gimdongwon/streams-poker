import { COMBINATION_TABLE, type CombinationType } from "@/types/game";

/** 조합 타입 → 번역 키. useT 와 함께: t(comboKey(type)) */
export const comboKey = (type: string): string => `combo.${type}`;

// DB/서버에 한국어로 저장·전달된 조합 이름 → 타입 역매핑.
// (leaderboard best_combo, combinationNames 등 이름 문자열만 있는 경우 번역용)
export const KO_NAME_TO_COMBO_TYPE: Record<string, CombinationType> =
  Object.fromEntries(
    COMBINATION_TABLE.map((c) => [c.name, c.type])
  ) as Record<string, CombinationType>;

/** 한국어 조합 이름 문자열을 타입으로 변환(없으면 null). */
export const comboTypeFromKoName = (name: string): CombinationType | null =>
  KO_NAME_TO_COMBO_TYPE[name] ?? null;
