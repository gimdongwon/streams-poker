import { NextRequest, NextResponse } from "next/server";
import { claimDaily } from "@/lib/coins";

// POST /api/coins/daily { userId } → { claimed, coins }
export const POST = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
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
