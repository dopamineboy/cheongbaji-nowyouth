import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 좌하단 Next.js 개발 모드 인디케이터(N 배지) 비활성화 — 시니어 친화 UI 검증
  // 시 시각적 노이즈를 줄이기 위함. production에는 영향 없음 (원래 안 보임).
  devIndicators: false,
};

export default nextConfig;
