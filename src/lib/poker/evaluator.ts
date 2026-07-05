import type { Card, NormalCard } from "@/types/card";
import { isJoker, isNormal, RANK_VALUES } from "@/types/card";
import type { ScoredCombination, Slot } from "@/types/game";
import { COMBINATION_TABLE } from "@/types/game";

type SlotCard = {
  card: NormalCard;
  slotIndex: number;
};

const getRankValue = (rank: string): number =>
  RANK_VALUES[rank as keyof typeof RANK_VALUES];

const canFormStraightWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  if (values.length + jokerCount < 5) return false;

  const valueSet = new Set(values);

  for (let start = 2; start <= 9; start++) {
    let missing = 0;
    for (let v = start; v < start + 5; v++) {
      if (!valueSet.has(v)) missing++;
    }
    if (missing <= jokerCount) return true;
  }

  return false;
};

const canFormMountainWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  const target = [1, 10, 11, 12, 13];
  const valueSet = new Set(values);
  const missing = target.filter((v) => !valueSet.has(v)).length;
  return missing <= jokerCount;
};

const canFormBackStraightWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  const target = [1, 2, 3, 4, 5];
  const valueSet = new Set(values);
  const missing = target.filter((v) => !valueSet.has(v)).length;
  return missing <= jokerCount;
};

const findConsecutiveGroups = (
  slots: Slot[],
  length: number
): { cards: NormalCard[]; slotIndices: number[]; jokerIndices: number[] }[] => {
  const groups: {
    cards: NormalCard[];
    slotIndices: number[];
    jokerIndices: number[];
  }[] = [];

  for (let start = 0; start <= slots.length - length; start++) {
    const windowSlots = slots.slice(start, start + length);
    const normalCards: NormalCard[] = [];
    const slotIndices: number[] = [];
    const jokerIndices: number[] = [];

    let valid = true;
    for (const slot of windowSlots) {
      if (!slot.card) {
        valid = false;
        break;
      }
      if (isJoker(slot.card)) {
        jokerIndices.push(slot.index);
      } else {
        normalCards.push(slot.card);
      }
      slotIndices.push(slot.index);
    }

    if (valid) {
      groups.push({ cards: normalCards, slotIndices, jokerIndices });
    }
  }

  return groups;
};

const getNormalSlotCards = (slots: Slot[]): SlotCard[] => {
  return slots
    .filter(
      (s): s is Slot & { card: NormalCard } =>
        s.card !== null && isNormal(s.card)
    )
    .map((s) => ({ card: s.card, slotIndex: s.index }));
};

const getJokerSlotIndices = (slots: Slot[]): number[] => {
  return slots
    .filter((s) => s.card !== null && isJoker(s.card!))
    .map((s) => s.index);
};

// ─── 스트레이트 계열: 연속 슬롯 기반 ───

const findStraights = (
  slots: Slot[],
  usedCardIds: Set<string>
): ScoredCombination[] => {
  const results: ScoredCombination[] = [];
  const groups = findConsecutiveGroups(slots, 5);

  for (const group of groups) {
    const availableCards = group.cards.filter((c) => !usedCardIds.has(c.id));
    const availableJokers = group.jokerIndices.filter(
      (idx) => !usedCardIds.has(slots[idx].card!.id)
    );

    if (availableCards.length + availableJokers.length < 5) continue;

    const values = availableCards.map((c) => getRankValue(c.rank));
    const jokerCount = availableJokers.length;

    const allCards = group.slotIndices
      .map((idx) => slots[idx].card!)
      .filter((c) => !usedCardIds.has(c.id));

    const effectivelySameSuit =
      availableCards.length <= 1 ||
      availableCards.every((c) => c.suit === availableCards[0].suit);

    if (effectivelySameSuit) {
      if (canFormMountainWithJokers(values, jokerCount)) {
        results.push({
          ...COMBINATION_TABLE.find(
            (c) => c.type === "royal_straight_flush"
          )!,
          cards: allCards,
          slotIndices: group.slotIndices,
        });
        continue;
      }

      if (canFormBackStraightWithJokers(values, jokerCount)) {
        results.push({
          ...COMBINATION_TABLE.find(
            (c) => c.type === "back_straight_flush"
          )!,
          cards: allCards,
          slotIndices: group.slotIndices,
        });
        continue;
      }

      if (canFormStraightWithJokers(values, jokerCount)) {
        results.push({
          ...COMBINATION_TABLE.find((c) => c.type === "straight_flush")!,
          cards: allCards,
          slotIndices: group.slotIndices,
        });
        continue;
      }
    }

    if (canFormMountainWithJokers(values, jokerCount)) {
      results.push({
        ...COMBINATION_TABLE.find((c) => c.type === "mountain")!,
        cards: allCards,
        slotIndices: group.slotIndices,
      });
      continue;
    }

    if (canFormBackStraightWithJokers(values, jokerCount)) {
      results.push({
        ...COMBINATION_TABLE.find((c) => c.type === "back_straight")!,
        cards: allCards,
        slotIndices: group.slotIndices,
      });
      continue;
    }

    if (canFormStraightWithJokers(values, jokerCount)) {
      results.push({
        ...COMBINATION_TABLE.find((c) => c.type === "straight")!,
        cards: allCards,
        slotIndices: group.slotIndices,
      });
    }
  }

  return results;
};

// ─── 플러시: 인접 5칸, 같은 문양 (조커 포함) ───

const findFlushes = (
  slots: Slot[],
  usedCardIds: Set<string>
): ScoredCombination[] => {
  const results: ScoredCombination[] = [];
  const groups = findConsecutiveGroups(slots, 5);

  for (const group of groups) {
    const availableCards = group.cards.filter((c) => !usedCardIds.has(c.id));
    const availableJokers = group.jokerIndices.filter(
      (idx) => !usedCardIds.has(slots[idx].card!.id)
    );

    if (availableCards.length + availableJokers.length < 5) continue;

    const suits = new Set(availableCards.map((c) => c.suit));
    if (suits.size > 1) continue;

    const allCards = group.slotIndices
      .map((idx) => slots[idx].card!)
      .filter((c) => !usedCardIds.has(c.id));

    results.push({
      ...COMBINATION_TABLE.find((c) => c.type === "flush")!,
      cards: allCards,
      slotIndices: group.slotIndices,
    });
  }

  return results;
};

// ─── 숫자 기반 조합: 인접 슬롯만 허용 (조커 포함 가능) ───

const findNumberCombinations = (
  slots: Slot[],
  usedCardIds: Set<string>
): ScoredCombination[] => {
  const results: ScoredCombination[] = [];
  const localUsed = new Set<string>();

  const isAvailable = (slot: Slot): boolean => {
    if (!slot.card) return false;
    return !usedCardIds.has(slot.card.id) && !localUsed.has(slot.card.id);
  };

  const checkAdjacentNOfAKind = (
    startIdx: number,
    size: number
  ): { cards: Card[]; slotIndices: number[] } | null => {
    const normalCards: NormalCard[] = [];
    const allCards: Card[] = [];
    const slotIndices: number[] = [];

    for (let i = startIdx; i < startIdx + size; i++) {
      const slot = slots[i];
      if (!isAvailable(slot)) return null;

      allCards.push(slot.card!);
      slotIndices.push(i);

      if (isNormal(slot.card!)) {
        normalCards.push(slot.card as NormalCard);
      }
    }

    const ranks = new Set(normalCards.map((c) => c.rank));
    if (ranks.size > 1) return null;

    return { cards: allCards, slotIndices };
  };

  // 포카드: 인접 4장이 같은 숫자 (조커 포함)
  for (let i = 0; i <= slots.length - 4; i++) {
    const match = checkAdjacentNOfAKind(i, 4);
    if (!match) continue;

    results.push({
      ...COMBINATION_TABLE.find((c) => c.type === "four_of_a_kind")!,
      cards: match.cards,
      slotIndices: match.slotIndices,
    });
    match.cards.forEach((c) => localUsed.add(c.id));
  }

  // 트리플: 인접 3장이 같은 숫자 (조커 포함)
  for (let i = 0; i <= slots.length - 3; i++) {
    const match = checkAdjacentNOfAKind(i, 3);
    if (!match) continue;

    results.push({
      ...COMBINATION_TABLE.find((c) => c.type === "triple")!,
      cards: match.cards,
      slotIndices: match.slotIndices,
    });
    match.cards.forEach((c) => localUsed.add(c.id));
  }

  // 페어: 인접 2장이 같은 숫자 (조커 포함).
  // 투페어(3점)로 묶으면 원페어 2개(2+2=4점)보다 손해라, 각각 원페어로 둔다 → 총점 최대.
  for (let i = 0; i <= slots.length - 2; i++) {
    const match = checkAdjacentNOfAKind(i, 2);
    if (!match) continue;

    results.push({
      ...COMBINATION_TABLE.find((c) => c.type === "one_pair")!,
      cards: match.cards,
      slotIndices: match.slotIndices,
    });
    match.cards.forEach((c) => localUsed.add(c.id));
  }

  // 풀하우스 업그레이드: 인접 트리플 + 인접 페어 → 풀하우스(15)가 트리플+페어 합보다 높음
  const triples = results.filter((r) => r.type === "triple");
  const singlePairs = results.filter((r) => r.type === "one_pair");

  if (triples.length > 0 && singlePairs.length > 0) {
    const triple = triples[0];
    const pairSource = singlePairs[0];

    const fullHouse: ScoredCombination = {
      ...COMBINATION_TABLE.find((c) => c.type === "full_house")!,
      cards: [...triple.cards, ...pairSource.cards],
      slotIndices: [...triple.slotIndices, ...pairSource.slotIndices],
    };

    const filteredResults = results.filter(
      (r) => r !== triple && r !== pairSource
    );
    filteredResults.unshift(fullHouse);
    return filteredResults;
  }

  return results;
};

// ─── 총점 계산 헬퍼 ───

const sumScore = (combos: ScoredCombination[]): number =>
  combos.reduce((t, c) => t + c.score, 0);

// ─── 주어진 스트레이트 후보로 전체 평가 수행 ───

// 하나의 스트레이트(또는 없음)를 기준으로 나머지(플러시/숫자 조합)를 최적 배치해 결과 산출.
const buildFromStraight = (
  slots: Slot[],
  straight: ScoredCombination | null
): ScoredCombination[] => {
  const baseUsed = new Set<string>();
  const baseCombos: ScoredCombination[] = [];
  let hasStraightFlush = false;

  if (straight) {
    baseCombos.push(straight);
    straight.cards.forEach((c) => baseUsed.add(c.id));
    hasStraightFlush =
      straight.type === "royal_straight_flush" ||
      straight.type === "back_straight_flush" ||
      straight.type === "straight_flush";
  }

  if (hasStraightFlush) {
    return [...baseCombos, ...findNumberCombinations(slots, baseUsed)];
  }

  // 플러시 vs 숫자 조합 최적화 (두 순서 모두 시도)
  const usedA = new Set(baseUsed);
  const flushA = findFlushes(slots, usedA);
  const combosA: ScoredCombination[] = [];
  if (flushA.length > 0) {
    combosA.push(flushA[0]);
    flushA[0].cards.forEach((c) => usedA.add(c.id));
  }
  combosA.push(...findNumberCombinations(slots, usedA));
  const scoreA = sumScore(combosA);

  const usedB = new Set(baseUsed);
  const numberB = findNumberCombinations(slots, usedB);
  const combosB: ScoredCombination[] = [...numberB];
  numberB.forEach((c) => c.cards.forEach((card) => usedB.add(card.id)));
  const flushB = findFlushes(slots, usedB);
  if (flushB.length > 0) combosB.push(flushB[0]);
  const scoreB = sumScore(combosB);

  return [...baseCombos, ...(scoreA >= scoreB ? combosA : combosB)];
};

const evaluateWithStraightCandidates = (
  slots: Slot[],
  candidateStraights: ScoredCombination[]
): ScoredCombination[] => {
  // 후보 스트레이트(여러 위치/종류)를 각각 기준으로 시도 + 스트레이트 미사용까지 비교해
  // 총점이 가장 높은 조합 집합을 채택한다. (동일 형태라도 위치에 따라 남는 페어 등이 달라짐)
  const options: (ScoredCombination | null)[] = [...candidateStraights, null];

  let bestResult: ScoredCombination[] = [];
  let bestScore = -1;
  for (const st of options) {
    const res = buildFromStraight(slots, st);
    const sc = sumScore(res);
    if (sc > bestScore) {
      bestScore = sc;
      bestResult = res;
    }
  }
  return bestResult;
};

// ─── 메인 평가 함수 ───
// 조커 배분을 최적화하기 위해 3가지 전략을 시도하고
// 총점이 가장 높은 전략을 채택한다.
//   전략1: 최고 스트레이트 사용 (조커 포함 가능)
//   전략2: 조커 미사용 스트레이트만 허용 (조커를 플러시/숫자 조합에 투입)
//   전략3: 스트레이트 없이 플러시/숫자 조합만 (전체 카드 활용)

export const evaluateSlots = (slots: Slot[]): ScoredCombination[] => {
  const allStraights = findStraights(slots, new Set());

  // 전략 1: 최고 스트레이트 사용 (조커 포함 가능) → 나머지 플러시/숫자
  const result1 = evaluateWithStraightCandidates(slots, allStraights);

  // 전략 2: 조커 미포함 스트레이트만 → 조커를 플러시/숫자에 활용
  const nonJokerStraights = allStraights.filter(
    (combo) => !combo.cards.some((c) => isJoker(c))
  );
  const result2 = evaluateWithStraightCandidates(slots, nonJokerStraights);

  // 전략 3: 스트레이트 없이 → 모든 카드 플러시/숫자 조합에 활용
  const result3 = evaluateWithStraightCandidates(slots, []);

  // 최고 총점 전략 채택
  const strategies = [
    { result: result1, score: sumScore(result1) },
    { result: result2, score: sumScore(result2) },
    { result: result3, score: sumScore(result3) },
  ];

  return strategies.sort((a, b) => b.score - a.score)[0].result;
};

export const calculateTotalScore = (
  combinations: ScoredCombination[]
): number => {
  return combinations.reduce((total, combo) => total + combo.score, 0);
};

const TIEBREAKER_RANK: Record<string, number> = {
  A: 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13,
};

export const calculateTiebreaker = (
  combinations: ScoredCombination[]
): number => {
  let value = 0;
  for (const combo of combinations) {
    for (const card of combo.cards) {
      if (isNormal(card)) {
        value += TIEBREAKER_RANK[card.rank] ?? 0;
      }
    }
  }
  return value;
};
