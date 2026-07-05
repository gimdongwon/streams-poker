import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername, sendFriendRequest } from "@/lib/friends";
import { sendPushToUser } from "@/lib/push";
import { supabase } from "@/lib/supabase";

// username(아이디)로 상대를 찾아 친구 요청 전송
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, username } = body;

    if (!userId || !username) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    const target = await findUserByUsername(username);
    if (!target) {
      return NextResponse.json(
        { error: "존재하지 않는 아이디입니다" },
        { status: 400 }
      );
    }

    if (target.id === userId) {
      return NextResponse.json(
        { error: "자기 자신은 추가할 수 없습니다" },
        { status: 400 }
      );
    }

    await sendFriendRequest(userId, target.id);

    // 상대에게 푸시 알림 (자격증명 미설정 시 no-op)
    try {
      const { data: me } = await supabase
        .from("users")
        .select("nickname")
        .eq("id", userId)
        .maybeSingle();
      const requesterName = me?.nickname ?? "누군가";
      await sendPushToUser(target.id, {
        title: "TENTENS",
        body: `${requesterName}님이 친구 요청을 보냈어요`,
        data: { type: "friend_request" },
      });
    } catch {
      // 푸시 실패는 무시 (친구 요청 자체는 성공)
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/friends/request error:", JSON.stringify(err));
    // 중복(이미 친구/요청) 등 사용자에게 보여줄 메시지면 400으로 전달
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    if (err instanceof Error && message === "이미 친구이거나 요청이 있습니다") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "친구 요청에 실패했습니다", detail: message },
      { status: 500 }
    );
  }
};
