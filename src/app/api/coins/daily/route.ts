import { NextRequest, NextResponse } from "next/server";
import { claimDaily } from "@/lib/coins";
import { supabase } from "@/lib/supabase";

// POST /api/coins/daily { userId } → { claimed, coins }
export const POST = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
    }
    // 게스트 어뷰징 차단: 정식 계정만 일일 보상 수령 (게스트는 무한 재생성 가능하므로).
    const { data: u } = await supabase
      .from("users")
      .select("is_guest")
      .eq("id", userId)
      .single();
    if (u?.is_guest) {
      return NextResponse.json(
        { error: "게스트는 일일 보상을 받을 수 없어요. 계정을 만들어 주세요." },
        { status: 403 }
      );
    }
    const result = await claimDaily(userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/coins/daily error:", err);
    return NextResponse.json(
      { error: "일일 보상 지급에 실패했습니다" },
      { status: 500 }
    );
  }
};
