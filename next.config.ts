import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 앱 링크 연동 파일들의 Content-Type 보장 (iOS AASA 는 확장자가 없어 기본이 octet-stream)
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
