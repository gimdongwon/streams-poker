import { NextRequest, NextResponse } from "next/server";
import { respondFriendRequest } from "@/lib/friends";

// 받은 친구 요청 수락/거절
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { friendshipId, userId, accept } = body;

    if (!friendshipId || !userId || typeof accept !== "boolean") {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    await respondFriendRequest(friendshipId, userId, accept);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/friends/respond error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "요청 처리에 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};
