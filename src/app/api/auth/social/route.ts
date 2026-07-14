import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";

// 네이티브 소셜 로그인(Apple/Google) ID 토큰을 서버에서 검증하고,
// 게스트를 같은 users.id 로 승격하거나(없으면) 기존 계정으로 로그인시킨다.
// - 클라가 보낸 토큰을 절대 그대로 믿지 않고 provider 공개키로 검증한다.
// - audience(clientId/bundleId)는 env 로 주입:
//     Google: NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID (네이티브 구글 로그인 idToken 의 aud)
//     Apple : APPLE_AUDIENCE (기본 kr.tentens.app = 앱 번들 ID)

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

const GOOGLE_AUD = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const APPLE_AUD = process.env.APPLE_AUDIENCE || "kr.tentens.app";

const SAFE_FIELDS = "id, username, nickname, created_at, coins, is_guest";

type Verified = { sub: string; email: string | null; name: string | null };

const verifyGoogle = async (idToken: string): Promise<Verified> => {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: GOOGLE_AUD,
  });
  return {
    sub: String(payload.sub),
    email: (payload.email as string) ?? null,
    name: (payload.name as string) ?? null,
  };
};

const verifyApple = async (idToken: string): Promise<Verified> => {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: APPLE_AUD,
  });
  return {
    sub: String(payload.sub),
    email: (payload.email as string) ?? null,
    name: null, // Apple 이름은 토큰에 없음 → 클라가 첫 로그인 응답에서 name 전달
  };
};

export const POST = async (request: NextRequest) => {
  try {
    const { provider, idToken, currentUserId, name } = await request.json();

    if ((provider !== "apple" && provider !== "google") || !idToken) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }
    if (provider === "google" && !GOOGLE_AUD) {
      return NextResponse.json(
        { error: "구글 로그인이 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    let v: Verified;
    try {
      v = provider === "google" ? await verifyGoogle(idToken) : await verifyApple(idToken);
    } catch (e) {
      console.error("social token verify failed:", e);
      return NextResponse.json({ error: "토큰 검증에 실패했습니다" }, { status: 401 });
    }

    const displayName: string | null = (name as string) ?? v.name;
    const nickname = displayName ? displayName.slice(0, 12) : null;

    // 1) 이미 이 소셜 identity 로 가입된 계정? → 기존 계정 로그인(병합 X, 게스트 진행은 버림)
    const { data: existing } = await supabase
      .from("users")
      .select(SAFE_FIELDS)
      .eq("provider", provider)
      .eq("provider_sub", v.sub)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ user: existing, linked: false });
    }

    // 2) 없으면: 현재 게스트를 이 identity 로 승격 (같은 id 유지 → 전적 승계)
    if (currentUserId) {
      const { data: cur } = await supabase
        .from("users")
        .select("id, is_guest")
        .eq("id", currentUserId)
        .maybeSingle();

      if (cur?.is_guest) {
        const upd: Record<string, unknown> = {
          provider,
          provider_sub: v.sub,
          email: v.email,
          is_guest: false,
        };
        if (nickname) upd.nickname = nickname;

        const { data: upgraded, error } = await supabase
          .from("users")
          .update(upd)
          .eq("id", currentUserId)
          .eq("is_guest", true)
          .select(SAFE_FIELDS)
          .single();

        if (error) throw error;
        return NextResponse.json({ user: upgraded, linked: true });
      }
    }

    // 3) 게스트가 아니거나 세션 없음 → 이 identity 로 새 계정 생성
    const rand = Math.floor(1000 + Math.random() * 9000);
    const { data: created, error: cErr } = await supabase
      .from("users")
      .insert({
        username: `${provider}_${v.sub}`,
        nickname: nickname || `플레이어${rand}`,
        provider,
        provider_sub: v.sub,
        email: v.email,
        is_guest: false,
      })
      .select(SAFE_FIELDS)
      .single();

    if (cErr) throw cErr;
    return NextResponse.json({ user: created, linked: false });
  } catch (err) {
    console.error("POST /api/auth/social error:", err);
    return NextResponse.json({ error: "소셜 로그인에 실패했습니다" }, { status: 500 });
  }
};
