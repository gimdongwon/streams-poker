// 결과 공유: 모바일 네이티브 공유 시트 → 실패/미지원 시 클립보드 복사 fallback.
export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export const shareResult = async (
  text: string,
  url?: string
): Promise<ShareOutcome> => {
  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.origin : "");

  // 1) 네이티브 공유 (모바일)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "TENTENS", text, url: shareUrl });
      return "shared";
    } catch (err) {
      // 사용자가 취소한 경우는 조용히 종료
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // 그 외에는 복사로 폴백
    }
  }

  // 2) 클립보드 복사 fallback
  const payload = `${text} ${shareUrl}`.trim();
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(payload);
      return "copied";
    }
  } catch {
    // 무시하고 실패 처리
  }

  return "failed";
};
