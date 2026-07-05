import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import type { Slot, SlotIndex } from "@/types/game";
import type { Card, NormalCard, Suit, Rank } from "@/types/card";

// 토큰 표기: 랭크(A 2 3 4 5 6 7 8 9 T J Q K) + 문양(s h d c), 조커는 "*".
// 예: "Tc" = 클로버 10, "As" = 스페이드 A, "*" = 조커
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
    const card: NormalCard = {
      type: "normal",
      rank: RANKMAP[tok[0]],
      suit: SUITMAP[tok[1]],
      id: `${tok}-${i}`,
    };
    return { index: i as SlotIndex, card };
  });

const score = (tokens: string[]): number =>
  calculateTotalScore(evaluateSlots(board(tokens)));

const names = (tokens: string[]): string[] =>
  evaluateSlots(board(tokens)).map((c) => c.type);

// ── 스트레이트 위치 최적화 (회귀: 위치에 따라 페어가 깨지던 버그) ──
test("스트레이트 여러 위치 중 총점 최대 선택 — 5~9로 잡아 4·4 페어 보존", () => {
  // ranks: 2,5,3,4,4,5,6,7,8,9  → 스트레이트(5~9) + 원페어(4,4) = 14
  const p2 = ["2c", "5d", "3s", "4c", "4h", "5h", "6c", "7d", "8d", "9c"];
  assert.equal(score(p2), 14);
  assert.deepEqual(names(p2).sort(), ["one_pair", "straight"].sort());
});

test("같은 형태 두 보드는 같은 점수(위치 무관)", () => {
  const a = ["2c", "3s", "4s", "4h", "5h", "5d", "6c", "7d", "8d", "9c"];
  const b = ["2c", "5d", "3s", "4c", "4h", "5h", "6c", "7d", "8d", "9c"];
  assert.equal(score(a), score(b));
  assert.equal(score(a), 14);
});

// ── 기본 조합 점수 ──
test("순수 스트레이트 = 12", () => {
  assert.equal(score(["5c", "6s", "7h", "8d", "9c", "Ac", "2h", "Kd", "Js", "Qh"]), 12);
});

test("스트레이트 플러시 = 25", () => {
  assert.equal(score(["5c", "6c", "7c", "8c", "9c", "Ah", "2s", "Kd", "Js", "Qh"]), 25);
});

test("로열 스트레이트 플러시 = 40", () => {
  assert.equal(score(["Tc", "Jc", "Qc", "Kc", "Ac", "2h", "4s", "6d", "8s", "9h"]), 40);
});

test("포카드(인접 4장) = 21", () => {
  assert.equal(score(["7c", "7s", "7h", "7d", "2c", "4h", "9s", "Jd", "Kc", "3s"]), 21);
});

test("풀하우스(인접 트리플+인접 페어) = 15", () => {
  assert.equal(score(["7c", "7s", "7h", "9c", "9s", "2d", "4h", "Jc", "Ks", "3d"]), 15);
});

test("투페어 = 3", () => {
  assert.equal(score(["3c", "3s", "8h", "8d", "2c", "5h", "9s", "Jd", "Kc", "6s"]), 3);
});

test("원페어 = 2", () => {
  assert.equal(score(["5c", "5s", "2h", "8d", "Tc", "3h", "9s", "Jd", "Kc", "7s"]), 2);
});

test("조합 없음 = 0", () => {
  assert.equal(score(["2c", "7s", "3h", "9d", "5c", "Js", "Kh", "4d", "Qc", "8s"]), 0);
});

// ── 조커 ──
test("조커가 스트레이트 플러시 완성 (5,6,*,8,9 클로버) = 25", () => {
  assert.equal(score(["5c", "6c", "*", "8c", "9c", "Ah", "2s", "Kd", "Js", "Qh"]), 25);
});

test("조커가 포카드 완성 (7,7,*,7 인접) = 21", () => {
  assert.equal(score(["7c", "7s", "*", "7h", "2c", "4h", "9s", "Jd", "Kc", "3s"]), 21);
});
