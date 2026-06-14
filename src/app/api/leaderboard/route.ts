import { NextRequest, NextResponse } from "next/server";
import { fetchUserRankings, submitScore } from "@/lib/leaderboard";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const data = await fetchUserRankings(limit);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json(
      { error: "랭킹을 불러오는 데 실패했습니다", detail: String(err) },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { user_id, nickname, score, combinations, combination_count, mode } =
      body;

    if (!user_id || !nickname || score == null || !combinations) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    await submitScore({
      user_id,
      nickname,
      score,
      combinations,
      combination_count,
      mode: mode === "single" || mode === "multi" ? mode : undefined,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leaderboard error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "점수를 저장하는 데 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};
