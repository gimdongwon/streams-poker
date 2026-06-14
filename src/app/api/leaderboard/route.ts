import { NextRequest, NextResponse } from "next/server";
import { fetchUserRankings, submitScore } from "@/lib/leaderboard";
import { evaluateSlots, calculateTotalScore } from "@/lib/poker/evaluator";
import type { Card } from "@/types/card";
import type { Slot, SlotIndex } from "@/types/game";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const data = await fetchUserRankings(limit);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json(
      { error: "랭킹을 불러오는 데 실패했습니다", detail: String(err) },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { user_id, nickname, slots, mode } = body;

    if (!user_id || !nickname || !Array.isArray(slots) || slots.length !== 10) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 점수는 클라이언트 값을 신뢰하지 않고 보드(slots)로 서버에서 재계산한다.
    const slotObjs: Slot[] = (slots as (Card | null)[]).map((card, i) => ({
      index: i as SlotIndex,
      card: card ?? null,
    }));
    const results = evaluateSlots(slotObjs);
    const score = calculateTotalScore(results);
    const combinations = results.map((r) => r.name);

    await submitScore({
      user_id,
      nickname,
      score,
      combinations,
      combination_count: combinations.length,
      mode: mode === "single" || mode === "multi" ? mode : undefined,
    });

    return NextResponse.json({ ok: true, score }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leaderboard error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "점수를 저장하는 데 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};
