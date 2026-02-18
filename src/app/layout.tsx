import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalHandRankings } from "@/components/common/GlobalHandRankings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Streams Poker - 전략 카드 게임",
  description: "10장의 카드를 전략적으로 배치하여 최고 포커 점수를 만들어보세요",
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
        {children}
        <GlobalHandRankings />
      </body>
    </html>
  );
}
