import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalHandRankings } from "@/components/common/GlobalHandRankings";
import { OrientationGate } from "@/components/common/OrientationGate";
import { CapacitorBootstrap } from "@/components/common/CapacitorBootstrap";
import { SessionBootstrap } from "@/components/common/SessionBootstrap";
import "./globals.css";

const GA_TRACKING_ID = "G-TFPP8C8KDJ";
const GTM_ID = "GTM-TRMPCGCZ";

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
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
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
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <SessionBootstrap />
        <CapacitorBootstrap />
        <OrientationGate />
        <GlobalHandRankings />
      </body>
    </html>
  );
}
