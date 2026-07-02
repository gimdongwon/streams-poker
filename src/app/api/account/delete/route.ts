import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

// 계정 삭제. 비밀번호를 재확인한 뒤 users 행을 삭제한다.
// leaderboard.user_id / friendships 는 ON DELETE CASCADE 라 함께 정리된다.
// service_role 클라이언트라 RLS 를 우회한다.
export const POST = async (request: NextRequest) => {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "계정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    const { error: delErr } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/account/delete error:", err);
    return NextResponse.json(
      { error: "계정 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
};
