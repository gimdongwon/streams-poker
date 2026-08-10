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

    // 신규 유저: 정식 계정 + 아직 추천인 미등록이어야 함
    const { data: me, error: meErr } = await supabase
      .from("users")
      .select("id, is_guest, referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) throw meErr;
    if (!me || me.is_guest) {
      return NextResponse.json({ error: "정식 계정만 가능합니다" }, { status: 400 });
    }
    if (me.referred_by) {
      return NextResponse.json({ claimed: false, reason: "already" });
    }

    // 초대자: 존재하는 정식 계정 + 보상 상한 미달
    const { data: referrer, error: refErr } = await supabase
      .from("users")
      .select("id, is_guest")
      .eq("id", refCode)
      .maybeSingle();
    if (refErr) throw refErr;
    if (!referrer || referrer.is_guest) {
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
