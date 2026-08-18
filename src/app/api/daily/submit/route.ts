import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { kstToday } from "@/lib/daily";
import { submitScore } from "@/lib/leaderboard";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import type { Card } from "@/types/card";
import type { Slot, SlotIndex } from "@/types/game";

// 참여 보상 (시스템 지급, 1일 1회 — 도전 자체가 1일 1회라 자동 보장).
const DAILY_PARTICIPATION_REWARD = 20;

// POST /api/daily/submit { userId, slots }
// 점수는 클라 값을 신뢰하지 않고 slots 로 서버에서 재계산한다.
export const POST = async (request: NextRequest) => {
  try {
    const { userId, slots } = await request.json();
    if (!userId || !Array.isArray(slots) || slots.length !== 10) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    const date = kstToday();

    // 시작된 미제출 도전이 있어야 한다.
    const { data: attempt, error: selErr } = await supabase
      .from("daily_scores")
      .select("id, submitted_at")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (selErr) throw selErr;

    if (!attempt) {
      return NextResponse.json({ error: "시작된 도전이 없습니다" }, { status: 400 });
    }
    if (attempt.submitted_at) {
      return NextResponse.json({ error: "이미 제출했습니다" }, { status: 409 });
    }

    // 서버 권위 재계산
    const slotObjs: Slot[] = (slots as (Card | null)[]).map((card, i) => ({
      index: i as SlotIndex,
      card: card ?? null,
    }));
    const results = evaluateSlots(slotObjs);
    const score = calculateTotalScore(results);
    const combos = results.map((r) => r.name);

    const { error: updErr } = await supabase
      .from("daily_scores")
      .update({ score, slots, combos, submitted_at: new Date().toISOString() })
      .eq("id", attempt.id);
    if (updErr) throw updErr;

    // 누적 랭킹에도 반영 (leaderboard 테이블, mode="daily") — 실패해도 데일리 제출은 유효.
    try {
      const { data: userRow } = await supabase
        .from("users")
        .select("nickname")
        .eq("id", userId)
        .maybeSingle();
      const best = results.reduce<(typeof results)[number] | null>(
        (acc, r) => (acc === null || r.rank < acc.rank ? r : acc),
        null
      );
      await submitScore({
        user_id: userId,
        nickname: userRow?.nickname ?? "?",
        score,
        combinations: combos,
        combination_count: combos.length,
        mode: "daily",
        best_combo: best?.name ?? null,
        best_combo_rank: best?.rank ?? null,
      });
    } catch (e) {
      console.error("daily → leaderboard 반영 실패:", e);
    }

    // 참여 보상 지급 (실패해도 제출 자체는 유효)
    let coins: number | null = null;
    try {
      const { data } = await supabase.rpc("add_coins", {
        uid: userId,
        amount: DAILY_PARTICIPATION_REWARD,
      });
      coins = Number(data);
    } catch {
      // ignore
    }

    // 오늘 순위 (게스트 포함 — 게스트 중심 모델)
    const { count: better } = await supabase
      .from("daily_scores")
      .select("id, users!inner(nickname)", { count: "exact", head: true })
      .eq("date", date)
      .not("submitted_at", "is", null)
      .gt("score", score);
    const { count: total } = await supabase
      .from("daily_scores")
      .select("id, users!inner(nickname)", { count: "exact", head: true })
      .eq("date", date)
      .not("submitted_at", "is", null);

    return NextResponse.json({
      score,
      combos,
      rank: (better ?? 0) + 1,
      total: total ?? 1,
      reward: DAILY_PARTICIPATION_REWARD,
      coins,
    });
  } catch (err) {
    console.error("POST /api/daily/submit error:", err);
    return NextResponse.json(
      { error: "결과 제출에 실패했습니다" },
      { status: 500 }
    );
  }
};
