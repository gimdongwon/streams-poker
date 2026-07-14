import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export const POST = async (request: NextRequest) => {
  try {
    const { username, nickname, password } = await request.json();

    if (!username || !nickname || !password) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "아이디는 3~20자로 입력해주세요" },
        { status: 400 }
      );
    }

    if (nickname.length < 1 || nickname.length > 12) {
      return NextResponse.json(
        { error: "닉네임은 1~12자로 입력해주세요" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        nickname,
        password_hash: passwordHash,
      })
      .select("id, username, nickname, created_at, coins, is_guest")
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err) {
    const detail =
      err && typeof err === "object"
        ? {
            message: (err as { message?: string }).message,
            code: (err as { code?: string }).code,
            details: (err as { details?: string }).details,
            hint: (err as { hint?: string }).hint,
          }
        : { message: String(err) };
    console.error("POST /api/auth/signup error:", detail);
    return NextResponse.json(
      { error: "회원가입에 실패했습니다", detail },
      { status: 500 }
    );
  }
};
