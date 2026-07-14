import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 앱 부팅 시 익명 게스트 유저 생성 (비밀번호 없음, is_guest=true).
// 싱글 전적/코인은 이 id 로 저장되고, 멀티 입구에서 같은 id 로 정식 승격된다.
export const POST = async (_request: NextRequest) => {
  try {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const username = `guest_${crypto.randomUUID()}`;
    const nickname = `게스트${rand}`;

    const { data, error } = await supabase
      .from("users")
      .insert({ username, nickname, is_guest: true })
      .select("id, username, nickname, created_at, coins, is_guest")
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/auth/guest error:", err);
    return NextResponse.json(
      { error: "게스트 세션 생성에 실패했습니다" },
      { status: 500 }
    );
  }
};
