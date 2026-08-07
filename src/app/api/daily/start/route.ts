import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { dailyDeckFor, kstToday } from "@/lib/daily";

// POST /api/daily/start { userId }
// 오늘의 덱 도전 시작. 시작 시점에 도전권이 소진된다 (중도 이탈 재도전 방지 —
// 덱이 매일 동일하므로 카드 순서를 알고 다시 하면 유리해지기 때문).
export const POST = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    const date = kstToday();

    // 이미 오늘 도전했으면 (제출 여부 무관) 거부.
    const { data: existing, error: selErr } = await supabase
      .from("daily_scores")
      .select("id, score, submitted_at")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      return NextResponse.json(
        { alreadyPlayed: true, score: existing.score ?? null },
        { status: 409 }
      );
    }

    // 도전권 소진 (동시 요청은 UNIQUE 제약이 걸러준다).
    const { error: insErr } = await supabase
      .from("daily_scores")
      .insert({ user_id: userId, date });
    if (insErr) {
      // UNIQUE 위반 = 경쟁 요청이 먼저 시작함
      if (insErr.code === "23505") {
        return NextResponse.json({ alreadyPlayed: true }, { status: 409 });
      }
      throw insErr;
    }

    return NextResponse.json({ date, deck: dailyDeckFor(date) });
  } catch (err) {
    console.error("POST /api/daily/start error:", err);
    return NextResponse.json(
      { error: "오늘의 덱을 시작하지 못했습니다" },
      { status: 500 }
    );
  }
};
