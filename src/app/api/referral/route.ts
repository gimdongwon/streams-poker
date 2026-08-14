import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const REFERRAL_REWARD = 200;
// 초대자당 보상 지급 상한 (어뷰징 방지)
const MAX_REWARDED_REFERRALS = 10;

// POST /api/referral { userId, refCode }
// 정식 계정 전환/가입 직후 1회 호출. 초대자와 신규 유저 모두 +200 코인.
export const POST = async (request: NextRequest) => {
  try {
    const { userId, refCode } = await request.json();
    if (!userId || !refCode || typeof refCode !== "string") {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }
    if (userId === refCode) {
      return NextResponse.json({ error: "본인 초대는 불가합니다" }, { status: 400 });
    }

    // 신규 유저: 존재 + 아직 추천인 미등록 (게스트 허용 — 게스트 중심 모델)
    const { data: me, error: meErr } = await supabase
      .from("users")
      .select("id, referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) throw meErr;
    if (!me) {
      return NextResponse.json({ error: "존재하지 않는 사용자입니다" }, { status: 400 });
    }
    if (me.referred_by) {
      return NextResponse.json({ claimed: false, reason: "already" });
    }

    // 어뷰징 방지: 초대받은 유저가 실제로 게임을 1판 이상 완료했어야 보상.
    // (가입 즉시 지급이 아니라 "첫 게임 완료" 기준 — API 직접 호출로는 못 뚫는다)
    const { count: gamesPlayed } = await supabase
      .from("leaderboard")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    let hasGame = (gamesPlayed ?? 0) >= 1;
    if (!hasGame) {
      // 오늘의 덱만 한 경우도 인정
      const { count: dailyPlayed } = await supabase
        .from("daily_scores")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("submitted_at", "is", null);
      hasGame = (dailyPlayed ?? 0) >= 1;
    }
    if (!hasGame) {
      return NextResponse.json({ claimed: false, reason: "no_game_yet" });
    }

    // 초대자: 존재 확인 + 보상 상한 미달
    const { data: referrer, error: refErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", refCode)
      .maybeSingle();
    if (refErr) throw refErr;
    if (!referrer) {
      return NextResponse.json({ claimed: false, reason: "invalid_ref" });
    }

    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", refCode);
    const referrerCapped = (count ?? 0) >= MAX_REWARDED_REFERRALS;

    // 추천 관계 기록 (referred_by가 아직 null일 때만 — 동시 요청 방지)
    const { data: updated, error: updErr } = await supabase
      .from("users")
      .update({ referred_by: refCode })
      .eq("id", userId)
      .is("referred_by", null)
      .select("id");
    if (updErr) throw updErr;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ claimed: false, reason: "already" });
    }

    // 보상 지급: 신규 유저는 항상, 초대자는 상한 내에서만
    let myCoins: number | null = null;
    try {
      const { data } = await supabase.rpc("add_coins", {
        uid: userId,
        amount: REFERRAL_REWARD,
      });
      myCoins = Number(data);
    } catch {
      // ignore
    }
    if (!referrerCapped) {
      try {
        await supabase.rpc("add_coins", { uid: refCode, amount: REFERRAL_REWARD });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      claimed: true,
      reward: REFERRAL_REWARD,
      coins: myCoins,
    });
  } catch (err) {
    console.error("POST /api/referral error:", err);
    return NextResponse.json(
      { error: "초대 보상 처리에 실패했습니다" },
      { status: 500 }
    );
  }
};
