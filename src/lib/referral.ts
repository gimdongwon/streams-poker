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

// 게임 완료 후 호출 — 저장된 ref가 있으면 보상 청구.
// "첫 게임 완료" 기준이라, 아직 게임 기록이 서버에 안 닿았으면(no_game_yet) ref를
// 유지해 다음 판에서 재시도한다. 성공/확정 실패 시에만 제거.
export const claimReferralIfPending = async (userId: string): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    const ref = window.localStorage.getItem(REF_KEY);
    if (!ref) return;
    if (ref === userId) {
      window.localStorage.removeItem(REF_KEY);
      return;
    }
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, refCode: ref }),
    });
    if (!res.ok) {
      // 잘못된 요청(자기 초대 등)은 재시도 무의미 → 제거
      if (res.status === 400) window.localStorage.removeItem(REF_KEY);
      return;
    }
    const data: { claimed: boolean; reason?: string } = await res.json();
    if (data.claimed || data.reason === "already" || data.reason === "invalid_ref") {
      window.localStorage.removeItem(REF_KEY);
    }
    // no_game_yet 이면 유지 → 다음 게임 완료 때 재시도
  } catch {
    // 네트워크 실패 — 유지 후 재시도
  }
};

// 내 초대 링크
export const referralLink = (userId: string): string =>
  `https://www.tentens.kr/?ref=${userId}`;
