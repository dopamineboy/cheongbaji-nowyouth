// GET /api/keepalive
// Vercel Lambda 인스턴스를 워밍 상태로 유지하기 위한 경량 ping 엔드포인트.
// UptimeRobot 같은 외부 cron이 5분마다 호출 → 인스턴스가 idle로 죽지 않게 함.
// 모바일에서 콜드 스타트로 인한 홈(/) 타임아웃 방지.
//
// 응답은 가볍게 (수십 바이트), 캐시 금지로 매번 실제 함수 실행되도록.
// ensureJobsLoaded()를 호출해서 새 인스턴스가 깨어났을 때 KORDI ingestion도
// 백그라운드로 트리거 (fire-and-forget이라 응답을 지연시키지 않음).

import { NextResponse } from "next/server";
import { ensureJobsLoaded } from "../../lib/jobs/ingestion/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // 인스턴스 첫 깨움이면 KORDI ingestion 백그라운드로 시작
  // (ensureJobsLoaded는 await 없이 즉시 반환되도록 수정되어 있음)
  void ensureJobsLoaded();

  return NextResponse.json(
    {
      ok: true,
      ts: Date.now(),
      uptime: Math.floor(process.uptime()),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
