// 친구 초대 추적: 링크(?ref=유저ID)로 들어온 방문을 기억했다가,
// 정식 계정이 되는 순간 1회 보상을 청구한다. (게스트 가입은 어뷰징이 쉬워 제외)
const REF_KEY = "tens-ref";

// UUID 형태만 저장 (ref 파라미터 오염 방지)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 현재 URL의 ?ref= 파라미터를 저장. 페이지 진입 시 호출.
export const captureReferral = (): void => {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && UUID_RE.test(ref)) {
      window.localStorage.setItem(REF_KEY, ref);
    }
  } catch {
    // ignore
  }
};

// 정식 계정 확보 직후 호출 — 저장된 ref가 있으면 보상 청구 후 제거.
export const claimReferralIfPending = async (userId: string): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    const ref = window.localStorage.getItem(REF_KEY);
    if (!ref || ref === userId) return;
    // 성공/실패와 무관하게 1회만 시도 (중복 요청 방지)
    window.localStorage.removeItem(REF_KEY);
    await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, refCode: ref }),
    });
  } catch {
    // ignore
  }
};

// 내 초대 링크
export const referralLink = (userId: string): string =>
  `https://www.tentens.kr/?ref=${userId}`;
