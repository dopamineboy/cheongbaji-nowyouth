// GET /api/video/{jobs|activity|community}
//
// 안내영상 프록시 — GitHub Releases 자산을 video/mp4 Content-Type으로 재매핑.
// GitHub Releases는 mp4를 application/octet-stream + Content-Disposition: attachment 로
// 내려보내서 iOS Safari가 "다운로드 파일"로 해석하고 <video> 재생을 거부함.
// 이 라우트가 fetch 후 헤더를 video/mp4로 다시 씌워서 모든 브라우저 호환 확보.
//
// Edge runtime — 모든 region 자동 배포, 콜드 스타트 빠름. Range request도 forwarding.

export const runtime = "edge";
export const dynamic = "force-dynamic";

const VIDEOS: Record<string, string> = {
  jobs: "https://github.com/dopamineboy/cheongbaji-nowyouth/releases/download/videos-v1/jobs.mp4",
  activity:
    "https://github.com/dopamineboy/cheongbaji-nowyouth/releases/download/videos-v1/activity.mp4",
  community:
    "https://github.com/dopamineboy/cheongbaji-nowyouth/releases/download/videos-v1/community.mp4",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const url = VIDEOS[name];
  if (!url) {
    return new Response("Video not found", { status: 404 });
  }

  // Range 헤더 forwarding (iOS Safari streaming 필수)
  const upstreamHeaders: HeadersInit = {};
  const range = req.headers.get("range");
  if (range) upstreamHeaders.Range = range;

  const upstream = await fetch(url, {
    headers: upstreamHeaders,
    redirect: "follow",
    // GitHub Releases JWT 토큰은 30분 만료 — 매번 fresh fetch 필요
    cache: "no-store",
  });

  // 응답 헤더 재구성 — video/mp4 강제 + range 메타데이터 보존
  const headers = new Headers();
  headers.set("Content-Type", "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  // CDN 캐시 금지 — GitHub Releases 30분 토큰 만료 시 truncated 응답이 캐시되는 문제 방지
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("CDN-Cache-Control", "no-store");

  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  const cr = upstream.headers.get("content-range");
  if (cr) headers.set("Content-Range", cr);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
