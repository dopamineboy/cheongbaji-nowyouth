// 일자리 수집 파이프라인 트리거·상태
//   POST /api/admin/ingestion       — 파이프라인 즉시 실행
//   GET  /api/admin/ingestion       — 어댑터 상태 조회 (사용 가능 여부 + 마지막 동기화)
//
// 운영 환경에서는 Vercel Cron 또는 외부 cron이 1시간마다 POST를 트리거.
import { NextRequest } from "next/server";
import {
  adapterStatus,
  runIngestion,
  type PipelineRunOptions,
} from "../../../lib/jobs/ingestion/pipeline";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true; // 개발 단계 — 토큰 미설정 시 통과
  return token === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "권한이 없어요." } },
      { status: 401 },
    );
  }
  return Response.json({
    ok: true,
    data: { adapters: adapterStatus() },
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "권한이 없어요." } },
      { status: 401 },
    );
  }

  let body: PipelineRunOptions = {};
  try {
    body = await req.json();
  } catch {
    // 빈 body 허용
  }

  const summary = await runIngestion(body);
  return Response.json({ ok: true, data: summary });
}
