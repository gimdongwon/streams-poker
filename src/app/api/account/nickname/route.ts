import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 닉네임 변경. 길이(1~12) 검증 후 users.nickname 을 갱신한다.
// 과거 게임 기록의 닉네임은 그대로 남지만, 누적 랭킹 뷰는 최신 닉네임을 사용한다.
export const POST = async (request: NextRequest) => {
  try {
    const { userId, nickname } = await request.json();

    if (!userId || typeof nickname !== "string") {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    const trimmed = nickname.trim();
    if (trimmed.length < 1 || trimmed.length > 12) {
      return NextResponse.json(
        { error: "닉네임은 1~12자로 입력해주세요" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update({ nickname: trimmed })
      .eq("id", userId)
      .select("id, username, nickname, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "계정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("POST /api/account/nickname error:", err);
    return NextResponse.json(
      { error: "닉네임 변경에 실패했습니다" },
      { status: 500 }
    );
  }
};
