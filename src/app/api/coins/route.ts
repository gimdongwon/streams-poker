import { NextRequest, NextResponse } from "next/server";
import { getCoinState } from "@/lib/coins";

// GET /api/coins?userId= → { coins, canClaimDaily }
export const GET = async (request: NextRequest) => {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
    }
    const state = await getCoinState(userId);
    return NextResponse.json(state);
  } catch (err) {
    console.error("GET /api/coins error:", err);
    return NextResponse.json(
      { error: "코인 정보를 불러오지 못했습니다" },
      { status: 500 }
    );
  }
};
