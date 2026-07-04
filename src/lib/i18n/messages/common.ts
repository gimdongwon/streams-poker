import type { Locale } from "../locales";

export type Dict = Record<string, string>;
export type Namespace = Record<Locale, Dict>;

export const common: Namespace = {
  ko: {
    "common.back": "← 뒤로가기",
    "common.refresh": "새로고침",
    "common.retry": "다시 시도",
    "common.loading": "로딩 중...",
    "common.close": "닫기",
    "common.me": "나",
    "common.you": "(나)",
    "unit.points": "{n}점",
    "unit.games": "{n}판",

    "combo.royal_straight_flush": "로열 스트레이트 플러시",
    "combo.back_straight_flush": "백 스트레이트 플러시",
    "combo.straight_flush": "스트레이트 플러시",
    "combo.four_of_a_kind": "포카드",
    "combo.mountain": "마운틴",
    "combo.full_house": "풀하우스",
    "combo.back_straight": "백스트레이트",
    "combo.flush": "플러시",
    "combo.straight": "스트레이트",
    "combo.triple": "트리플",
    "combo.two_pair": "투페어",
    "combo.one_pair": "원페어",
  },
  en: {
    "common.back": "← Back",
    "common.refresh": "Refresh",
    "common.retry": "Retry",
    "common.loading": "Loading...",
    "common.close": "Close",
    "common.me": "You",
    "common.you": "(You)",
    "unit.points": "{n} pts",
    "unit.games": "{n} games",

    "combo.royal_straight_flush": "Royal Straight Flush",
    "combo.back_straight_flush": "Back Straight Flush",
    "combo.straight_flush": "Straight Flush",
    "combo.four_of_a_kind": "Four of a Kind",
    "combo.mountain": "Mountain",
    "combo.full_house": "Full House",
    "combo.back_straight": "Back Straight",
    "combo.flush": "Flush",
    "combo.straight": "Straight",
    "combo.triple": "Three of a Kind",
    "combo.two_pair": "Two Pair",
    "combo.one_pair": "One Pair",
  },
};
