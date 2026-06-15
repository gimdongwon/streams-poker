import { NextRequest, NextResponse } from "next/server";
import { listFriends, removeFriend } from "@/lib/friends";

// 친구 목록 조회
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

    const friends = await listFriends(userId);
    return NextResponse.json(friends);
  } catch (err) {
    console.error("GET /api/friends error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "친구 목록을 불러오는 데 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};

// 친구 삭제
export const DELETE = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { friendshipId, userId } = body;

    if (!friendshipId || !userId) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    await removeFriend(friendshipId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/friends error:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: "친구를 삭제하는 데 실패했습니다",
        detail: err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
};
