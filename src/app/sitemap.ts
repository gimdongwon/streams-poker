import type { MetadataRoute } from "next";

const BASE = "https://www.tentens.kr";

// 검색엔진용 사이트맵 — 마케팅/콘텐츠 페이지만 포함.
// (게임 화면들은 로그인 상태 의존 UI라 색인 대상이 아님)
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/guide`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/guide/scoring`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/guide/strategy`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
