import { supabase } from "./supabase";

// 서버발 푸시 발송 (FCM HTTP v1). Android(FCM) 및 iOS(Firebase+APNs 연동 시) 지원.
// 자격증명이 없으면 조용히 no-op → 앱 기능은 정상 동작.
//
// 필요한 환경변수 (Firebase 서비스 계정):
//   FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
// (iOS 는 Firebase 콘솔에 APNs 인증키 업로드 필요 — docs/ios-app-store-guide.md 참고)

type PushPayload = { title: string; body: string; data?: Record<string, string> };

const base64url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// 서비스 계정으로 FCM 전송용 OAuth2 access token 발급 (JWT grant)
const getAccessToken = async (): Promise<string | null> => {
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim().replace(/^"|"$/g, "");
  // 환경변수 값이 큰따옴표로 감싸져 있거나 \n 이스케이프된 경우 모두 정규화
  let privateKey = process.env.FCM_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  if (!clientEmail || !privateKey) return null;

  try {
    const { createSign } = await import("crypto");
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = base64url(
      JSON.stringify({
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    const signature = base64url(signer.sign(privateKey));
    const jwt = `${header}.${claim}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
};

const getUserTokens = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", userId);
    if (error || !data) return [];
    return data.map((r) => r.token as string);
  } catch {
    return [];
  }
};

// 무효/만료된 토큰을 테이블에서 제거 (다음 발송부터 제외 → 자동 정리)
const deleteToken = async (token: string): Promise<void> => {
  try {
    await supabase.from("push_tokens").delete().eq("token", token);
    console.log(`[Push] 무효 토큰 삭제: ...${token.slice(-12)}`);
  } catch {
    // 무시
  }
};

// FCM 에러 응답이 "토큰 자체가 무효"임을 뜻하면 true (삭제 대상)
const isInvalidTokenError = (status: number, body: string): boolean => {
  if (status === 404) return true; // UNREGISTERED
  // THIRD_PARTY_AUTH_ERROR: 대개 다른 팀/환경으로 발급된 stale 토큰(재빌드 전 옛 토큰) → 정리
  return /UNREGISTERED|INVALID_ARGUMENT|SENDER_ID_MISMATCH|THIRD_PARTY_AUTH_ERROR|registration token/i.test(
    body
  );
};

// 특정 유저의 모든 기기로 푸시 발송. 실패는 조용히 무시(fire-and-forget 권장).
export const sendPushToUser = async (
  userId: string,
  payload: PushPayload
): Promise<void> => {
  const projectId = process.env.FCM_PROJECT_ID;
  if (!projectId) {
    console.log("[Push] FCM_PROJECT_ID 미설정 → 발송 생략(no-op)");
    return;
  }

  const [accessToken, tokens] = await Promise.all([
    getAccessToken(),
    getUserTokens(userId),
  ]);

  if (!accessToken) {
    console.log("[Push] OAuth 액세스 토큰 발급 실패 (FCM_CLIENT_EMAIL/PRIVATE_KEY 확인)");
    return;
  }
  if (tokens.length === 0) {
    console.log(`[Push] 대상 유저(${userId})의 등록 토큰 없음 (앱에서 로그인/권한 허용 필요)`);
    return;
  }

  console.log(`[Push] ${tokens.length}개 토큰으로 발송 시도 (user ${userId})`);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const results = await Promise.allSettled(
    tokens.map((token) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: payload.data ?? {},
            // 기본 알림음 (Android/iOS)
            android: {
              notification: { sound: "default" },
            },
            apns: {
              payload: { aps: { sound: "default" } },
            },
          },
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const body = await r.text();
          console.log(
            `[Push] FCM 실패 HTTP ${r.status} (토큰 ...${token.slice(-12)}): ${body.slice(0, 500)}`
          );
          if (isInvalidTokenError(r.status, body)) await deleteToken(token);
        } else {
          console.log("[Push] FCM 발송 성공");
        }
      })
    )
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.log(`[Push] 네트워크 예외 ${failed}건`);
};
