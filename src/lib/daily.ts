// 오늘의 덱 — 날짜+비밀 솔트 시드로 결정적 셔플. 서버(API 라우트) 전용.
// DAILY_SECRET 이 서버에만 있으므로 클라이언트는 덱을 미리 계산할 수 없다.
import { createHash } from "crypto";
import type { Card } from "@/types/card";
import { createDeck } from "@/lib/poker/deck";

// KST(UTC+9) 기준 오늘 날짜 "YYYY-MM-DD" — 자정 리셋 기준.
export const kstToday = (): string => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};

// 자정(KST)까지 남은 ms.
export const msUntilKstMidnight = (): number => {
  const now = Date.now() + 9 * 60 * 60 * 1000;
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now;
};

// mulberry32 — 시드 기반 결정적 PRNG.
const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// 날짜 → 오늘의 덱 10장. 같은 날짜는 항상 같은 결과.
export const dailyDeckFor = (date: string): Card[] => {
  const secret = process.env.DAILY_SECRET ?? "tentens-daily-default";
  const digest = createHash("sha256").update(`${date}:${secret}`).digest();
  const seed = digest.readUInt32BE(0);
  const rand = mulberry32(seed);

  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 10);
};
