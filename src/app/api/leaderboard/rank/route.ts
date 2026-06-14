import { NextRequest, NextResponse } from "next/server";
import { fetchUserRank } from "@/lib/leaderboard";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다" },
        { status: 400 }
      );
    }

    const info = await fetchUserRank(userId);
    return NextResponse.json(info);
  } catch {
    return NextResponse.json(
      { error: "순위를 조회하는 데 실패했습니다" },
      { status: 500 }
    );
  }
};
