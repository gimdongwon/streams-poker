import type { Namespace } from "./common";

// 첫 설치 튜토리얼 문자열.
export const tutorial: Namespace = {
  ko: {
    "tutorial.title": "튜토리얼",
    "tutorial.skip": "건너뛰기",
    "tutorial.round": "라운드 {n}/{total}",
    "tutorial.intro.title": "30초면 배워요!",
    "tutorial.intro.body":
      "매 라운드 카드 1장이 나와요. 10초 안에 보드에 배치하면 끝!\n\n딱 하나만 기억하세요 — 조합은 나란히 붙은 칸에서만 만들어져요.",
    "tutorial.intro.start": "시작하기",
    "tutorial.step1": "첫 카드예요! 반짝이는 첫 칸에 놓아보세요",
    "tutorial.step2": "같은 숫자는 바로 옆에 붙여야 원페어(+2)가 돼요!",
    "tutorial.step3": "새 조합은 새 구역에서 — 아랫줄에 놓아볼까요?",
    "tutorial.step4": "K 옆에 붙여서 원페어 하나 더!",
    "tutorial.step5": "페어 옆에 같은 숫자를 하나 더 — 트리플(+10)로 업그레이드!",
    "tutorial.anywhere": "(다른 칸에 놓아도 괜찮아요 — 자유롭게!)",
    "tutorial.done.title": "튜토리얼 완료! 🎉",
    "tutorial.done.score": "총 {score}점 획득",
    "tutorial.done.body":
      "실전은 10라운드! 연속 숫자(스트레이트), 같은 문양(플러시)도 인접 5칸으로 만들 수 있어요. 조커(X)는 자동으로 최적의 조합에 배정됩니다.",
    "tutorial.done.reward": "🪙 축하 보상 +{n} 코인!",
    "tutorial.done.rewardAlready": "보상은 이미 받았어요",
    "tutorial.done.toLobby": "로비로 가기",
    "tutorial.prompt.title": "TENTENS가 처음이신가요?",
    "tutorial.prompt.body": "30초 튜토리얼로 핵심 규칙을 익히고 +100 코인도 받아가세요!",
    "tutorial.prompt.start": "튜토리얼 시작",
    "tutorial.prompt.skip": "바로 플레이할래요",
    "tutorial.replay": "🎓 튜토리얼 다시 하기",
  },
  en: {
    "tutorial.title": "Tutorial",
    "tutorial.skip": "Skip",
    "tutorial.round": "Round {n}/{total}",
    "tutorial.intro.title": "Learn it in 30 seconds!",
    "tutorial.intro.body":
      "One card appears each round. Place it on the board within 10 seconds!\n\nJust remember one thing — combos only count on adjacent slots.",
    "tutorial.intro.start": "Start",
    "tutorial.step1": "Your first card! Place it on the glowing slot",
    "tutorial.step2": "Same ranks must sit side by side to make a pair (+2)!",
    "tutorial.step3": "New combo, new zone — try the bottom row",
    "tutorial.step4": "Next to the K — one more pair!",
    "tutorial.step5": "Add a third K beside the pair — upgrade to a triple (+10)!",
    "tutorial.anywhere": "(Any slot works too — feel free!)",
    "tutorial.done.title": "Tutorial complete! 🎉",
    "tutorial.done.score": "You scored {score} points",
    "tutorial.done.body":
      "Real games run 10 rounds! Straights (consecutive ranks) and flushes (same suit) also need 5 adjacent slots. Jokers (X) auto-assign to your best combo.",
    "tutorial.done.reward": "🪙 Bonus reward: +{n} coins!",
    "tutorial.done.rewardAlready": "Reward already claimed",
    "tutorial.done.toLobby": "Go to lobby",
    "tutorial.prompt.title": "New to TENTENS?",
    "tutorial.prompt.body": "Learn the core rule in a 30-second tutorial and earn +100 coins!",
    "tutorial.prompt.start": "Start tutorial",
    "tutorial.prompt.skip": "Play right away",
    "tutorial.replay": "🎓 Replay tutorial",
  },
};
