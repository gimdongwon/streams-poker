import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import { COMBINATION_TABLE } from "@/types/game";
import type { Slot, SlotIndex } from "@/types/game";
import type { Card, NormalCard, Suit, Rank } from "@/types/card";

// 토큰: 랭크(A 2 3 4 5 6 7 8 9 T J Q K)+문양(s h d c), 조커 "*". 예: "Tc","As","*"
const RANKMAP: Record<string, Rank> = {
  A: "A", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
  "8": "8", "9": "9", T: "10", J: "J", Q: "Q", K: "K",
};
const SUITMAP: Record<string, Suit> = { s: "spade", h: "heart", d: "diamond", c: "club" };

const board = (tokens: string[]): Slot[] =>
  tokens.map((tok, i): Slot => {
    if (tok === "*") {
      const card: Card = { type: "joker", jokerIndex: (i % 2 === 0 ? 1 : 2), id: `joker-${i}` };
      return { index: i as SlotIndex, card };
    }
    const card: NormalCard = { type: "normal", rank: RANKMAP[tok[0]], suit: SUITMAP[tok[1]], id: `${tok}-${i}` };
    return { index: i as SlotIndex, card };
  });

const score = (t: string[]): number => calculateTotalScore(evaluateSlots(board(t)));
const names = (t: string[]): string[] => evaluateSlots(board(t)).map((c) => c.type);

// ── 배점 표: 포커 순서(강함=낮은 rank)와 점수 내림차순이 일치해야 함 ──
test("족보 표는 점수 내림차순 + rank 오름차순 정렬", () => {
  for (let i = 1; i < COMBINATION_TABLE.length; i++) {
    assert.ok(
      COMBINATION_TABLE[i - 1].score > COMBINATION_TABLE[i].score,
      `score 내림차순 위반: ${COMBINATION_TABLE[i - 1].type} > ${COMBINATION_TABLE[i].type}`
    );
    assert.equal(COMBINATION_TABLE[i].rank, COMBINATION_TABLE[i - 1].rank + 1);
  }
});

const V = Object.fromEntries(COMBINATION_TABLE.map((c) => [c.type, c.score]));

test("포커 룰 배점 관계 — 플러시>스트레이트, 풀하우스>플러시, 포카드>풀하우스, 투페어>원페어2개, 트리플>투페어", () => {
  assert.ok(V.flush > V.straight);
  assert.ok(V.full_house > V.flush);
  assert.ok(V.four_of_a_kind > V.full_house);
  assert.ok(V.straight_flush > V.four_of_a_kind);
  assert.ok(V.two_pair > 2 * V.one_pair);
  assert.ok(V.triple > V.two_pair);
  assert.ok(V.straight > V.triple);
});

// ── 스트레이트 위치 최적화 (회귀: 위치에 따라 페어가 깨지던 버그) ──
test("스트레이트 여러 위치 중 총점 최대 — 5~9로 잡아 4·4 페어 보존", () => {
  const p2 = ["2c", "5d", "3s", "4c", "4h", "5h", "6c", "7d", "8d", "9c"];
  assert.equal(score(p2), V.straight + V.one_pair); // 14 + 2 = 16
  assert.deepEqual(names(p2).sort(), ["one_pair", "straight"].sort());
});

test("같은 형태 두 보드는 같은 점수", () => {
  const a = ["2c", "3s", "4s", "4h", "5h", "5d", "6c", "7d", "8d", "9c"];
  const b = ["2c", "5d", "3s", "4c", "4h", "5h", "6c", "7d", "8d", "9c"];
  assert.equal(score(a), score(b));
});

// ── 기본 조합 ──
test("순수 스트레이트", () => {
  assert.equal(score(["5c", "6s", "7h", "8d", "9c", "Ac", "2h", "Kd", "Js", "Qh"]), V.straight);
});
test("스트레이트 플러시", () => {
  assert.equal(score(["5c", "6c", "7c", "8c", "9c", "Ah", "2s", "Kd", "Js", "Qh"]), V.straight_flush);
});
test("로열 스트레이트 플러시", () => {
  assert.equal(score(["Tc", "Jc", "Qc", "Kc", "Ac", "2h", "4s", "6d", "8s", "9h"]), V.royal_straight_flush);
});
test("포카드", () => {
  assert.equal(score(["7c", "7s", "7h", "7d", "2c", "4h", "9s", "Jd", "Kc", "3s"]), V.four_of_a_kind);
});
test("풀하우스(인접 트리플+페어)", () => {
  assert.equal(score(["7c", "7s", "7h", "9c", "9s", "2d", "4h", "Jc", "Ks", "3d"]), V.full_house);
});
test("떨어진 트리플+페어는 풀하우스 아님 → 트리플+원페어 (회귀)", () => {
  // 슬롯4·5=3·3(페어), 슬롯7·8·9=조커·K·K(트리플). 서로 붙어있지 않음.
  const t = ["4d", "5d", "7s", "3s", "3c", "Jc", "*", "Kc", "Kh", "8s"];
  assert.equal(score(t), V.triple + V.one_pair);
  assert.deepEqual(names(t).sort(), ["one_pair", "triple"].sort());
});
test("조커 트리플이 페어와 인접하면 풀하우스", () => {
  // 슬롯1·2·3=K·K·조커(트리플), 슬롯4·5=3·3(페어) → 연속 5칸
  assert.equal(score(["Kc", "Kh", "*", "3s", "3c", "8s", "Jc", "7d", "2h", "9c"]), V.full_house);
});
test("원페어", () => {
  assert.equal(score(["5c", "5s", "2h", "8d", "Tc", "3h", "9s", "Jd", "Kc", "7s"]), V.one_pair);
});
test("페어 2개 → 투페어로 병합", () => {
  const t = ["3c", "3s", "8h", "8d", "2c", "5h", "9s", "Jd", "Kc", "6s"];
  assert.equal(score(t), V.two_pair);
  assert.deepEqual(names(t), ["two_pair"]);
});
test("페어 4개 → 투페어 2개", () => {
  assert.equal(score(["Ad", "Ah", "7h", "2c", "2s", "Tc", "8s", "8c", "Jh", "Jc"]), V.two_pair * 2);
});
test("페어 3개 → 투페어 + 원페어", () => {
  assert.equal(score(["Ad", "Ah", "5s", "2h", "2c", "7s", "Tc", "4d", "Jh", "Jc"]), V.two_pair + V.one_pair);
});
test("조합 없음 = 0", () => {
  assert.equal(score(["2c", "7s", "3h", "9d", "5c", "Js", "Kh", "4d", "Qc", "8s"]), 0);
});

// ── 조커 ──
test("조커가 스트레이트 플러시 완성 (5,6,*,8,9 클로버)", () => {
  assert.equal(score(["5c", "6c", "*", "8c", "9c", "Ah", "2s", "Kd", "Js", "Qh"]), V.straight_flush);
});
test("조커가 포카드 완성 (7,7,*,7 인접)", () => {
  assert.equal(score(["7c", "7s", "*", "7h", "2c", "4h", "9s", "Jd", "Kc", "3s"]), V.four_of_a_kind);
});
