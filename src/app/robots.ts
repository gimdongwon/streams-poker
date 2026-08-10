import type { MetadataRoute } from "next";

// 크롤러 안내 — 앱 UI(로그인 의존 화면)와 API 는 색인 제외.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/lobby",
          "/room/",
          "/game/",
          "/me",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://www.tentens.kr/sitemap.xml",
  };
}
