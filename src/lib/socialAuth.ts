// 네이티브 소셜 로그인(Apple/Google) 래퍼. 네이티브에서만 동작.
// 플러그인에서 ID 토큰을 받아 서버(/api/auth/social)로 넘기고, 서버가 검증한다.
// ⚠️ 플러그인 응답 필드명(idToken/identityToken, profile.*)은 설치된 @capgo/capacitor-social-login
//    버전 기준으로 실기기에서 한 번 확인할 것(방어적으로 추출하도록 작성됨).
import { Capacitor } from "@capacitor/core";

export type SocialProvider = "apple" | "google";
export type SocialResult = { idToken: string | null; name: string | null };

// 소셜 로그인 노출 여부: 네이티브 + 설정 완료(env) 일 때만.
// (자격증명 미설정 상태로 배포해도 버튼이 안 떠서 안전 — 아이디/비번 승격으로 폴백)
export const isSocialEnabled = (): boolean =>
  Capacitor.isNativePlatform() &&
  process.env.NEXT_PUBLIC_SOCIAL_ENABLED === "true";

let initialized = false;
const ensureInit = async (): Promise<void> => {
  if (initialized) return;
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  // 플랫폼별로 해당 provider만 초기화한다.
  // (안드로이드에서 apple 을 초기화하면 redirectUrl 을 요구해 실패한다.)
  const init = SocialLogin.initialize as (cfg: unknown) => Promise<void>;
  const platform = Capacitor.getPlatform();
  if (platform === "android") {
    await init({
      google: { webClientId: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID },
    });
  } else if (platform === "ios") {
    await init({ apple: {} });
  }
  initialized = true;
};

export const socialLogin = async (
  provider: SocialProvider
): Promise<SocialResult> => {
  await ensureInit();
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  // Google 은 scopes 를 넘기면 네이티브 MainActivity 수정을 요구한다(플러그인 제약).
  // 기본 로그인은 ID토큰에 email/이름이 포함되므로 scopes 없이 진행.
  const options = provider === "google" ? {} : { scopes: ["email", "name"] };

  // 플러그인 login 시그니처(discriminated union)를 우회해 호출 후 방어적으로 파싱.
  const login = SocialLogin.login as (arg: unknown) => Promise<unknown>;
  const res = await login({ provider, options });

  const r = (((res as { result?: unknown })?.result ?? res) ??
    {}) as Record<string, unknown>;

  const idToken =
    (r.idToken as string) ??
    (r.identityToken as string) ??
    (r.accessToken as string) ??
    null;

  const prof = r.profile as
    | { givenName?: string; familyName?: string; name?: string }
    | undefined;
  let name: string | null = null;
  if (prof) {
    name =
      [prof.givenName, prof.familyName].filter(Boolean).join(" ") ||
      prof.name ||
      null;
  }

  return { idToken, name };
};
