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

/**
 * 스트레이트 판정 (일반): 연속 5개 값이 가능한 window가 있는지
 * - 중복 값이 있으면 하나의 슬롯을 차지하므로 조커로도 부족할 수 있음
 */
const canFormStraightWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  if (values.length + jokerCount < 5) return false;

  const valueSet = new Set(values);

  // 가능한 모든 5연속 윈도우 탐색 (2~6, 3~7, ..., 9~13)
  // A=1은 백스트레이트(1-5)와 마운틴(10-A)에서 별도 처리
  for (let start = 2; start <= 9; start++) {
    let missing = 0;
    for (let v = start; v < start + 5; v++) {
      if (!valueSet.has(v)) missing++;
    }
    if (missing <= jokerCount) return true;
  }

  return false;
};

/**
 * 마운틴 판정: A(1), 10, J(11), Q(12), K(13)
 */
const canFormMountainWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  const target = [1, 10, 11, 12, 13];
  const valueSet = new Set(values);
  const missing = target.filter((v) => !valueSet.has(v)).length;
  return missing <= jokerCount;
};

/**
 * 백스트레이트 판정: A(1), 2, 3, 4, 5
 */
const canFormBackStraightWithJokers = (
  values: number[],
  jokerCount: number
): boolean => {
  const target = [1, 2, 3, 4, 5];
  const valueSet = new Set(values);
  const missing = target.filter((v) => !valueSet.has(v)).length;
  return missing <= jokerCount;
};

/**
 * 연속 슬롯 그룹 추출: length개의 연속된 슬롯에 모두 카드가 있는 그룹
 */
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

    // ── 같은 문양 계열 (스트레이트 플러시) ──
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

    // ── 문양 무관 계열 ──
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

// ─── 플러시: 위치 무관, 같은 문양 5장 ───

const findFlushes = (
  slots: Slot[],
  usedCardIds: Set<string>
): ScoredCombination[] => {
  const results: ScoredCombination[] = [];
  const normalSlotCards = getNormalSlotCards(slots).filter(
    (sc) => !usedCardIds.has(sc.card.id)
  );
  const jokerSlotIndices = getJokerSlotIndices(slots).filter(
    (idx) => !usedCardIds.has(slots[idx].card!.id)
  );

  const suitGroups: Record<string, SlotCard[]> = {};
  for (const sc of normalSlotCards) {
    if (!suitGroups[sc.card.suit]) suitGroups[sc.card.suit] = [];
    suitGroups[sc.card.suit].push(sc);
  }

  for (const [, cards] of Object.entries(suitGroups)) {
    const needed = 5 - cards.length;
    if (needed >= 0 && needed <= jokerSlotIndices.length) {
      const flushCards: Card[] = cards.slice(0, 5).map((sc) => sc.card);
      const flushSlotIndices = cards.slice(0, 5).map((sc) => sc.slotIndex);

      const jokersToUse = jokerSlotIndices.slice(0, needed);
      for (const ji of jokersToUse) {
        flushCards.push(slots[ji].card!);
        flushSlotIndices.push(ji);
      }

      if (flushCards.length >= 5) {
        results.push({
          ...COMBINATION_TABLE.find((c) => c.type === "flush")!,
          cards: flushCards.slice(0, 5),
          slotIndices: flushSlotIndices.slice(0, 5),
        });
      }
    }
  }

  return results;
};

// ─── 숫자 기반 조합: 위치 무관 ───

const findNumberCombinations = (
  slots: Slot[],
  usedCardIds: Set<string>
): ScoredCombination[] => {
  const results: ScoredCombination[] = [];
  const normalSlotCards = getNormalSlotCards(slots).filter(
    (sc) => !usedCardIds.has(sc.card.id)
  );
  const jokerSlotIndices = getJokerSlotIndices(slots).filter(
    (idx) => !usedCardIds.has(slots[idx].card!.id)
  );

  const rankGroups: Record<string, SlotCard[]> = {};
  for (const sc of normalSlotCards) {
    if (!rankGroups[sc.card.rank]) rankGroups[sc.card.rank] = [];
    rankGroups[sc.card.rank].push(sc);
  }

  const rankEntries = Object.entries(rankGroups).sort(
    (a, b) => b[1].length - a[1].length
  );

  let availableJokers = jokerSlotIndices.length;
  const localUsed = new Set<string>();

  // 포카드 (같은 숫자 4장)
  for (const [, cards] of rankEntries) {
    const available = cards.filter((sc) => !localUsed.has(sc.card.id));
    const needed = 4 - available.length;
    if (needed >= 0 && needed <= availableJokers && available.length >= 2) {
      const comboCards: Card[] = available.slice(0, 4).map((sc) => sc.card);
      const comboSlots = available.slice(0, 4).map((sc) => sc.slotIndex);

      const jokersNeeded = Math.max(0, 4 - comboCards.length);
      for (let j = 0; j < jokersNeeded && availableJokers > 0; j++) {
        const ji =
          jokerSlotIndices[jokerSlotIndices.length - availableJokers];
        comboCards.push(slots[ji].card!);
        comboSlots.push(ji);
        availableJokers--;
      }

      if (comboCards.length === 4) {
        results.push({
          ...COMBINATION_TABLE.find((c) => c.type === "four_of_a_kind")!,
          cards: comboCards,
          slotIndices: comboSlots,
        });
        comboCards.forEach((c) => localUsed.add(c.id));
      }
    }
  }

  // 트리플 (같은 숫자 3장)
  for (const [, cards] of rankEntries) {
    const available = cards.filter((sc) => !localUsed.has(sc.card.id));
    if (available.length >= 3) {
      const tripleCards = available.slice(0, 3);
      results.push({
        ...COMBINATION_TABLE.find((c) => c.type === "triple")!,
        cards: tripleCards.map((sc) => sc.card),
        slotIndices: tripleCards.map((sc) => sc.slotIndex),
      });
      tripleCards.forEach((sc) => localUsed.add(sc.card.id));
    }
  }

  // 페어 (같은 숫자 2장)
  const pairs: ScoredCombination[] = [];
  for (const [, cards] of rankEntries) {
    const available = cards.filter((sc) => !localUsed.has(sc.card.id));
    if (available.length >= 2) {
      const pairCards = available.slice(0, 2);
      pairs.push({
        ...COMBINATION_TABLE.find((c) => c.type === "one_pair")!,
        cards: pairCards.map((sc) => sc.card),
        slotIndices: pairCards.map((sc) => sc.slotIndex),
      });
      pairCards.forEach((sc) => localUsed.add(sc.card.id));
    }
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

  // 풀하우스 업그레이드: 트리플 + 페어
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

    // 투페어에서 1페어를 풀하우스에 쓰고 남은 1페어 복원
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

// ─── 헬퍼: 조합 리스트 총점 ───

const sumScore = (combos: ScoredCombination[]): number =>
  combos.reduce((t, c) => t + c.score, 0);

// ─── 메인 평가 함수 ───
// 스트레이트는 슬롯 순서 기반이므로 항상 먼저 평가.
// 이후 플러시 vs 숫자 조합은 두 가지 순서를 모두 시도하여
// 총점이 더 높은 쪽을 채택한다. (조커 배분 최적화)

export const evaluateSlots = (slots: Slot[]): ScoredCombination[] => {
  const baseUsed = new Set<string>();
  const baseCombos: ScoredCombination[] = [];

  // ── 1단계: 스트레이트 계열 (연속 슬롯, 항상 먼저) ──
  const straightCombos = findStraights(slots, baseUsed);

  const straightFlushes = straightCombos.filter(
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
    const plainStraights = straightCombos.filter(
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

  // 스트레이트 플러시가 있으면 플러시/숫자 조합만 추가
  if (hasStraightFlush) {
    const numberCombos = findNumberCombinations(slots, baseUsed);
    return [...baseCombos, ...numberCombos];
  }

  // ── 2단계: 플러시 vs 숫자 조합 최적화 ──
  // 옵션 A: 플러시 먼저 → 숫자 조합
  const usedA = new Set(baseUsed);
  const flushA = findFlushes(slots, usedA);
  const combosA: ScoredCombination[] = [];

  if (flushA.length > 0) {
    combosA.push(flushA[0]);
    flushA[0].cards.forEach((c) => usedA.add(c.id));
  }
  const numberA = findNumberCombinations(slots, usedA);
  combosA.push(...numberA);
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

  // 더 높은 총점 옵션 채택
  const bestOption = scoreA >= scoreB ? combosA : combosB;

  return [...baseCombos, ...bestOption];
};

export const calculateTotalScore = (
  combinations: ScoredCombination[]
): number => {
  return combinations.reduce((total, combo) => total + combo.score, 0);
};
