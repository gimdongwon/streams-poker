import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

// 게스트 → 정식 계정 승격. 같은 users.id 를 유지한 채 자격증명을 설정하므로
// 싱글에서 쌓은 전적/코인이 그대로 승계된다. (signup 과 동일한 검증)
export const POST = async (request: NextRequest) => {
  try {
    const { userId, username, nickname, password } = await request.json();

    if (!userId || !username || !nickname || !password) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요" }, { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "아이디는 3~20자로 입력해주세요" }, { status: 400 });
    }
    if (nickname.length < 1 || nickname.length > 12) {
      return NextResponse.json({ error: "닉네임은 1~12자로 입력해주세요" }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ error: "비밀번호는 4자 이상 입력해주세요" }, { status: 400 });
    }

    // 대상이 게스트인지 확인
    const { data: target, error: tErr } = await supabase
      .from("users")
      .select("id, is_guest")
      .eq("id", userId)
      .single();

    if (tErr || !target) {
      return NextResponse.json({ error: "계정을 찾을 수 없습니다" }, { status: 404 });
    }
    if (!target.is_guest) {
      return NextResponse.json({ error: "이미 정식 계정입니다" }, { status: 409 });
    }

    // 아이디 중복 확인
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 같은 id 유지: insert 가 아니라 update. is_guest=true 조건으로 경합 방지.
    const { data, error } = await supabase
      .from("users")
      .update({
        username,
        nickname,
        password_hash: passwordHash,
        is_guest: false,
      })
      .eq("id", userId)
      .eq("is_guest", true)
      .select("id, username, nickname, created_at, coins, is_guest")
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "승격에 실패했습니다" }, { status: 409 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("POST /api/auth/upgrade error:", err);
    return NextResponse.json({ error: "승격에 실패했습니다" }, { status: 500 });
  }
};
