import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export const POST = async (request: NextRequest) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, nickname, password_hash, created_at, coins")
      .eq("username", username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    const { password_hash: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { error: "로그인에 실패했습니다" },
      { status: 500 }
    );
  }
};
