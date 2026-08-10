import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalHandRankings } from "@/components/common/GlobalHandRankings";
import { OrientationGate } from "@/components/common/OrientationGate";
import { CapacitorBootstrap } from "@/components/common/CapacitorBootstrap";
import { AnalyticsScripts } from "@/components/common/AnalyticsScripts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.tentens.kr";
const OG_TITLE = "TENTENS · 같은 카드, 다른 전략";
const OG_DESCRIPTION =
  "10장의 카드를 배치해 최고 점수에 도전하는 실시간 카드 게임";

// viewport-fit=cover → env(safe-area-inset-*) 활성화 (노치·둥근 모서리 회피용)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // iOS 인풋 포커스 시 자동 확대(그리고 키보드 내려도 확대 잔존) 방지. 가로 고정 게임이라 핀치줌 불필요.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  // iOS Safari Smart App Banner — 미설치 시 App Store 유도, 설치 시 앱 열기
  itunes: { appId: "6792527133" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TENTENS",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    locale: "ko_KR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TENTENS — 같은 카드, 다른 전략",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnalyticsScripts />
        {children}
        <CapacitorBootstrap />
        <OrientationGate />
        <GlobalHandRankings />
      </body>
    </html>
  );
}
