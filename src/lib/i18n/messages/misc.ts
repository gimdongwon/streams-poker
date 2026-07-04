import type { Namespace } from "./common";

// 이 네임스페이스의 문자열. ko/en 양쪽에 같은 키를 추가한다.
export const misc: Namespace = {
  ko: {
    "misc.orientation.ariaLabel": "가로 모드 안내",
    "misc.orientation.rotate": "가로로 돌려주세요",
    "misc.orientation.description": "TENTENS는 가로 모드에서 즐길 수 있어요",
    "misc.mute.on": "소리 켜기",
    "misc.mute.off": "소리 끄기",
    "misc.login.forcedOut": "다른 곳에서 로그인되어 자동 로그아웃되었습니다",
    "misc.login.forcedOut.retry": "다시 로그인해주세요",
    "misc.logo.home": "홈으로 이동",
    "misc.logo.tagline": "전략 카드 배치 게임",
  },
  en: {
    "misc.orientation.ariaLabel": "Landscape mode notice",
    "misc.orientation.rotate": "Please rotate to landscape",
    "misc.orientation.description": "TENTENS is best enjoyed in landscape mode",
    "misc.mute.on": "Turn sound on",
    "misc.mute.off": "Turn sound off",
    "misc.login.forcedOut":
      "You were logged out because you signed in elsewhere",
    "misc.login.forcedOut.retry": "Please log in again",
    "misc.logo.home": "Go to home",
    "misc.logo.tagline": "Strategic card placement game",
  },
};
