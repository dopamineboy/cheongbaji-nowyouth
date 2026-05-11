// GET /api/keepalive
// Vercel Edge 함수 워밍용 경량 ping 엔드포인트.
// UptimeRobot 같은 외부 cron이 5분마다 호출 → CDN 전역에 항상 살아있는 응답 유지.
// 모바일 콜드 스타트로 인한 홈(/) 타임아웃 방지.
//
// Edge runtime — 모든 region에 자동 배포되고 콜드 스타트가 수십 ms.
// Node 의존(ensureJobsLoaded) 제거로 빌드 단순화 + 배포 안정성 확보.
// (실제 데이터 ingestion은 홈 페이지 첫 요청 시 fire-and-forget으로 트리거됨)

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: true,
      ts: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
