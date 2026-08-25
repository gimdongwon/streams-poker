import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TUTORIAL_REWARD = 100;

// POST /api/tutorial/reward { userId }
// 튜토리얼 완료 보상 (+100, 유저당 1회).
// 중복 방지 마커로 coin_log(reason='tutorial', amount=0)를 사용한다 —
// 실제 지급은 add_coins RPC(로그 reason='add')라 오늘 획득 코인 집계와도 일치.
// coin_log 미생성(마이그레이션 0016 이전) 환경에선 보상 없이 rewarded:false.
export const POST = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
    }

    // 이미 받았는지 확인
    const { data: existing, error: checkError } = await supabase
      .from("coin_log")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", "tutorial")
      .limit(1);
    if (checkError) {
      // coin_log 테이블이 없는 경우 등 — 보상 없이 정상 종료
      return NextResponse.json({ rewarded: false, reward: 0 });
    }
    if ((existing ?? []).length > 0) {
      return NextResponse.json({ rewarded: false, already: true, reward: 0 });
    }

    // 마커 먼저 기록 (동시 요청 이중 지급 최소화) → 지급
    const { error: markError } = await supabase
      .from("coin_log")
      .insert({ user_id: userId, amount: 0, reason: "tutorial" });
    if (markError) throw markError;

    const { data: newBalance, error: addError } = await supabase.rpc("add_coins", {
      uid: userId,
      amount: TUTORIAL_REWARD,
    });
    if (addError) throw addError;

    return NextResponse.json({
      rewarded: true,
      reward: TUTORIAL_REWARD,
      coins: Number(newBalance),
    });
  } catch (err) {
    console.error("POST /api/tutorial/reward error:", err);
    return NextResponse.json(
      { error: "보상 지급에 실패했습니다" },
      { status: 500 }
    );
  }
};
