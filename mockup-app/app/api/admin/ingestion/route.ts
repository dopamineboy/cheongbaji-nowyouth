// 일자리 수집 파이프라인 트리거·상태
//   POST /api/admin/ingestion       — 파이프라인 즉시 실행 (어드민 UI)
//   GET  /api/admin/ingestion       — 어댑터 상태 조회
//   GET  /api/admin/ingestion?run=1 — Vercel Cron 트리거 (자동 동기화)
//
// 인증: 어드민은 x-admin-token 헤더, Vercel Cron은 Authorization: Bearer <CRON_SECRET>
import { NextRequest } from "next/server";
import {
  adapterStatus,
  runIngestion,
  type PipelineRunOptions,
} from "../../../lib/jobs/ingestion/pipeline";

function authorized(req: NextRequest): boolean {
  // 1. Vercel Cron — Authorization: Bearer ${CRON_SECRET}
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${cronSecret}`) return true;
  }
  // 2. 어드민 UI — x-admin-token 헤더
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected && !cronSecret) return true; // 개발 단계 — 토큰 미설정 시 통과
  return expected !== undefined && token === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "권한이 없어요." } },
      { status: 401 },
    );
  }

  // Vercel Cron 트리거: ?run=1 이면 ingestion 실행 (GET이지만 동기화 실행)
  const url = new URL(req.url);
  if (url.searchParams.get("run") === "1") {
    const summary = await runIngestion({});
    return Response.json({ ok: true, triggeredBy: "cron", data: summary });
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
