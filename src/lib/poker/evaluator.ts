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

  // 페어: 인접 2장이 같은 숫자 (조커 포함)
  const pairs: ScoredCombination[] = [];
  for (let i = 0; i <= slots.length - 2; i++) {
    const match = checkAdjacentNOfAKind(i, 2);
    if (!match) continue;

    pairs.push({
      ...COMBINATION_TABLE.find((c) => c.type === "one_pair")!,
      cards: match.cards,
      slotIndices: match.slotIndices,
    });
    match.cards.forEach((c) => localUsed.add(c.id));
  }

  // 투페어 업그레이드
  if (pairs.length >= 2) {
    for (let i = 0; i < pairs.length - 1; i += 2) {
      results.push({
        ...COMBINATION_TABLE.find((c) => c.type === "two_pair")!,
        cards: [...pairs[i].cards, ...pairs[i + 1].cards],
        slotIndices: [...pairs[i].slotIndices, ...pairs[i + 1].slotIndices],
      });
    }
    if (pairs.length % 2 === 1) {
      results.push(pairs[pairs.length - 1]);
    }
  } else {
    results.push(...pairs);
  }

  // 풀하우스 업그레이드: 인접 트리플 + 인접 페어
  const triples = results.filter((r) => r.type === "triple");
  const singlePairs = results.filter((r) => r.type === "one_pair");
  const twoPairs = results.filter((r) => r.type === "two_pair");

  if (triples.length > 0 && (singlePairs.length > 0 || twoPairs.length > 0)) {
    const triple = triples[0];
    const pairSource = singlePairs[0] || twoPairs[0];
    const pairCards = pairSource.cards.slice(0, 2);
    const pairSlots = pairSource.slotIndices.slice(0, 2);

    const fullHouse: ScoredCombination = {
      ...COMBINATION_TABLE.find((c) => c.type === "full_house")!,
      cards: [...triple.cards, ...pairCards],
      slotIndices: [...triple.slotIndices, ...pairSlots],
    };

    const filteredResults = results.filter(
      (r) => r !== triple && r !== pairSource
    );
    filteredResults.unshift(fullHouse);

    if (twoPairs.length > 0 && singlePairs.length === 0) {
      const remaining = twoPairs[0].cards.slice(2);
      const remainingSlots = twoPairs[0].slotIndices.slice(2);
      if (remaining.length === 2) {
        filteredResults.push({
          ...COMBINATION_TABLE.find((c) => c.type === "one_pair")!,
          cards: remaining,
          slotIndices: remainingSlots,
        });
      }
    }

    return filteredResults;
  }

  return results;
};

// ─── 총점 계산 헬퍼 ───

const sumScore = (combos: ScoredCombination[]): number =>
  combos.reduce((t, c) => t + c.score, 0);

// ─── 주어진 스트레이트 후보로 전체 평가 수행 ───

const evaluateWithStraightCandidates = (
  slots: Slot[],
  candidateStraights: ScoredCombination[]
): ScoredCombination[] => {
  const baseUsed = new Set<string>();
  const baseCombos: ScoredCombination[] = [];

  // 스트레이트 플러시 우선
  const straightFlushes = candidateStraights.filter(
    (c) =>
      c.type === "royal_straight_flush" ||
      c.type === "back_straight_flush" ||
      c.type === "straight_flush"
  );

  let hasStraightFlush = false;

  if (straightFlushes.length > 0) {
    const best = straightFlushes.sort((a, b) => a.rank - b.rank)[0];
    baseCombos.push(best);
    best.cards.forEach((c) => baseUsed.add(c.id));
    hasStraightFlush = true;
  } else {
    const plainStraights = candidateStraights.filter(
      (c) =>
        c.type === "mountain" ||
        c.type === "back_straight" ||
        c.type === "straight"
    );
    if (plainStraights.length > 0) {
      const best = plainStraights.sort((a, b) => a.rank - b.rank)[0];
      baseCombos.push(best);
      best.cards.forEach((c) => baseUsed.add(c.id));
    }
  }

  if (hasStraightFlush) {
    const numberCombos = findNumberCombinations(slots, baseUsed);
    return [...baseCombos, ...numberCombos];
  }

  // 플러시 vs 숫자 조합 최적화 (두 순서 모두 시도)
  // 옵션 A: 플러시 먼저 → 숫자 조합
  const usedA = new Set(baseUsed);
  const flushA = findFlushes(slots, usedA);
  const combosA: ScoredCombination[] = [];

  if (flushA.length > 0) {
    combosA.push(flushA[0]);
    flushA[0].cards.forEach((c) => usedA.add(c.id));
  }
  combosA.push(...findNumberCombinations(slots, usedA));
  const scoreA = sumScore(combosA);

  // 옵션 B: 숫자 조합 먼저 → 플러시
  const usedB = new Set(baseUsed);
  const numberB = findNumberCombinations(slots, usedB);
  const combosB: ScoredCombination[] = [...numberB];
  numberB.forEach((c) => c.cards.forEach((card) => usedB.add(card.id)));

  const flushB = findFlushes(slots, usedB);
  if (flushB.length > 0) {
    combosB.push(flushB[0]);
  }
  const scoreB = sumScore(combosB);

  const bestOption = scoreA >= scoreB ? combosA : combosB;

  return [...baseCombos, ...bestOption];
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
