// 서버 권위 점수 계산.
// 클라이언트가 보낸 점수를 신뢰하지 않고, 보드(slots)만으로 서버가 재계산한다.
// 클라이언트와 완전히 동일한 판정을 보장하기 위해 프론트 evaluator(@/lib/poker/evaluator)를
// 그대로 재사용한다. (tsx 가 tsconfig 의 @/* alias 를 런타임 해석하므로 커스텀 서버에서 import 가능)
import type { CardData, ResultCombo } from "./types";
import type { Card } from "@/types/card";
import type { Slot, SlotIndex } from "@/types/game";
import {
  evaluateSlots,
  calculateTotalScore,
  calculateTiebreaker,
} from "@/lib/poker/evaluator";
import { TOTAL_SLOTS } from "@/types/game";

export type BoardScore = {
  score: number;
  tiebreaker: number;
  combinationNames: string[];
  combinations: ResultCombo[];
};

// 서버 CardData 는 evaluator 의 Card 와 런타임 구조가 동일(type/suit/rank/id)하다.
// 컴파일 타임 타입만 브릿지한다.
const toCard = (c: CardData): Card => c as unknown as Card;

// slots 가 유효한 10칸 배열이 아니면 위조/버그로 간주하고 안전하게 0점 처리한다.
const isValidBoard = (slots: unknown): slots is (CardData | null)[] =>
  Array.isArray(slots) && slots.length === TOTAL_SLOTS;

export const scoreBoard = (slots: (CardData | null)[] | undefined): BoardScore => {
  if (!isValidBoard(slots)) {
    return { score: 0, tiebreaker: 0, combinationNames: [], combinations: [] };
  }

  const slotObjs: Slot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    index: i as SlotIndex,
    card: slots[i] ? toCard(slots[i] as CardData) : null,
  }));

  const results = evaluateSlots(slotObjs);

  return {
    score: calculateTotalScore(results),
    tiebreaker: calculateTiebreaker(results),
    combinationNames: results.map((r) => r.name),
    combinations: results.map((r) => ({
      type: r.type,
      name: r.name,
      score: r.score,
      slotIndices: r.slotIndices,
    })),
  };
};
