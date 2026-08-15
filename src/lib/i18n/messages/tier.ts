import type { Namespace } from "./common";
// tierup.* : 티어 승급 축하 레이어

// 이 네임스페이스의 문자열. ko/en 양쪽에 같은 키를 추가한다.
export const tier: Namespace = {
  ko: {
    "tierup.title": "티어 승급!",
    "tierup.desc": "축하합니다! {tier} 티어에 도달했어요. 다음 티어를 향해 계속 달려보세요!",
    "tierup.cta": "좋았어!",
    "tier.closeAria": "티어 안내 닫기",
    "tier.title": "티어 안내",
    "tier.intro": "누적 점수로 티어가 결정돼요.",
    "tier.remaining": "까지 {n}점 남음",
    "tier.max": "최고 티어 달성!",
    "tier.range": "{min} ~ {max}점",
    "tier.rangeMax": "{min}점 이상",
    "tier.badgeAria": "티어 {label}",
  },
  en: {
    "tierup.title": "Tier up!",
    "tierup.desc": "Congratulations — you've reached {tier}! Keep climbing toward the next tier!",
    "tierup.cta": "Let's go!",
    "tier.closeAria": "Close tier info",
    "tier.title": "Tiers",
    "tier.intro": "Your tier is set by total score.",
    "tier.remaining": ": {n} pts to go",
    "tier.max": "Top tier reached!",
    "tier.range": "{min} ~ {max} pts",
    "tier.rangeMax": "{min} pts and up",
    "tier.badgeAria": "Tier {label}",
  },
};
