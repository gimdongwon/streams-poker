// 튜토리얼 진행 여부 (로컬 저장) — 완료/건너뛰기 모두 done 처리.
const TUTORIAL_DONE_KEY = "tens-tutorial-done";
const TUTORIAL_PROMPTED_KEY = "tens-tutorial-prompted"; // 로비 제안 팝업 1회

export const isTutorialDone = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
  } catch {
    return true;
  }
};

export const markTutorialDone = () => {
  try {
    window.localStorage.setItem(TUTORIAL_DONE_KEY, "1");
  } catch {
    // ignore
  }
};

export const wasTutorialPrompted = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TUTORIAL_PROMPTED_KEY) === "1";
  } catch {
    return true;
  }
};

export const markTutorialPrompted = () => {
  try {
    window.localStorage.setItem(TUTORIAL_PROMPTED_KEY, "1");
  } catch {
    // ignore
  }
};
