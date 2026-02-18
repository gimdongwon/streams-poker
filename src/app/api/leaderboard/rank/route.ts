import { NextRequest, NextResponse } from "next/server";
import { fetchPlayerRank } from "@/lib/leaderboard";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const score = parseInt(searchParams.get("score") ?? "0", 10);

    const rank = await fetchPlayerRank(score);
    return NextResponse.json({ rank });
  } catch {
    return NextResponse.json(
      { error: "순위를 조회하는 데 실패했습니다" },
      { status: 500 }
    );
  }
};
