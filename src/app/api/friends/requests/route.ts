import { NextRequest, NextResponse } from "next/server";
import { listIncomingRequests } from "@/lib/friends";

// 받은 친구 요청(pending) 목록 조회
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

    const requests = await listIncomingRequests(userId);
    return NextResponse.json(requests);
  } catch (err) {
    console.error("GET /api/friends/requests error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "친구 요청을 불러오는 데 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};
