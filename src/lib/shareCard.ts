// 결과 공유 카드: 캔버스에 브랜딩된 카드를 그려 이미지로 공유/저장한다.
// 화면 캡처가 아니라 전용 디자인이라 기기와 무관하게 일관된 이미지가 나간다.
import { Capacitor } from "@capacitor/core";

export type ShareCardData = {
  modeLabel: string; // "오늘의 덱" / "싱글" / "멀티"
  nickname: string;
  score: number;
  scoreSuffix: string; // "점" / "pts"
  rankLine?: string | null; // "오늘 3위 / 47명", "1st place" 등
  combos: string[]; // 상위 조합 이름 (최대 3개 표시)
  footer: string; // "tentens.kr — 같은 카드, 다른 전략"
};

const W = 1080;
const H = 1080;

const CYAN = "#2de2e6";
const MAGENTA = "#ff2e97";
const VOID = "#0b0b12";
const PANEL = "#131826";
const SNOW = "#f2f5ff";
const HAZE = "#8b93ad";

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// 결과 카드를 그려 canvas 반환.
export const drawResultCard = (data: ShareCardData): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 배경
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, W, H);

  // 배경 장식: 네온 글로우 원
  const glow = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700);
  glow.addColorStop(0, "rgba(45,226,230,0.10)");
  glow.addColorStop(0.6, "rgba(255,46,151,0.05)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 카드 패널
  roundRect(ctx, 70, 90, W - 140, H - 180, 40);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = "rgba(45,226,230,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = "center";

  // 로고 워드마크 (그라데이션)
  const lg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  lg.addColorStop(0, CYAN);
  lg.addColorStop(1, MAGENTA);
  ctx.fillStyle = lg;
  ctx.font = `900 92px ${FONT}`;
  ctx.fillText("TENTENS", W / 2, 240);

  // 모드 라벨
  ctx.fillStyle = HAZE;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(`🃏 ${data.modeLabel}`, W / 2, 330);

  // 점수 (글로우)
  ctx.save();
  ctx.shadowColor = "rgba(45,226,230,0.6)";
  ctx.shadowBlur = 42;
  ctx.fillStyle = CYAN;
  ctx.font = `900 240px ${FONT}`;
  ctx.fillText(String(data.score), W / 2, 610);
  ctx.restore();
  ctx.fillStyle = HAZE;
  ctx.font = `700 48px ${FONT}`;
  ctx.fillText(data.scoreSuffix, W / 2 + ctx.measureText(String(data.score)).width / 2 + 150, 610);

  // 순위 라인
  if (data.rankLine) {
    ctx.fillStyle = SNOW;
    ctx.font = `800 56px ${FONT}`;
    ctx.fillText(`🏆 ${data.rankLine}`, W / 2, 710);
  }

  // 조합 (최대 3개)
  const combos = data.combos.slice(0, 3);
  if (combos.length > 0) {
    ctx.fillStyle = HAZE;
    ctx.font = `600 38px ${FONT}`;
    ctx.fillText(combos.join(" · "), W / 2, data.rankLine ? 790 : 720);
  }

  // 닉네임
  ctx.fillStyle = SNOW;
  ctx.font = `700 42px ${FONT}`;
  ctx.fillText(data.nickname, W / 2, 880);

  // 푸터
  ctx.fillStyle = HAZE;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(data.footer, W / 2, H - 60);

  return canvas;
};

export type ShareImageOutcome = "shared" | "downloaded" | "cancelled" | "failed";

// 카드 이미지를 공유 시트(네이티브/모바일 웹) 또는 다운로드(데스크톱)로 내보낸다.
export const shareCardImage = async (
  canvas: HTMLCanvasElement,
  filename = "tentens-result.png"
): Promise<ShareImageOutcome> => {
  const dataUrl = canvas.toDataURL("image/png");

  // 1) 네이티브: 캐시에 파일로 쓰고 공유 시트 (카톡 전송·사진 저장 모두 가능)
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = dataUrl.split(",")[1];
      const { uri } = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ files: [uri] });
      return "shared";
    } catch (err) {
      if (err instanceof Error && /cancel/i.test(err.message)) return "cancelled";
      // 플러그인 미탑재(구버전 앱 바이너리) 등 → 웹 경로로 폴백
    }
  }

  // 2) 모바일 웹: 파일 공유 시트
  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (blob && typeof navigator !== "undefined" && navigator.share) {
      const file = new File([blob], filename, { type: "image/png" });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return "shared";
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    // 아래 다운로드 폴백으로
  }

  // 3) 데스크톱: 다운로드
  try {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
    return "downloaded";
  } catch {
    return "failed";
  }
};
