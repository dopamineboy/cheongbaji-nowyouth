// 직접 등록 어드민 API
//   POST /api/admin/jobs   — 새 일자리 수동 등록 (어드민 전용)
//   GET  /api/admin/jobs   — 등록된 manual jobs 목록
import { NextRequest } from "next/server";
import { getStore } from "../../../lib/store";
import type { Job } from "../../../lib/types";

// S2에서는 JWT + 어드민 권한 검사. 현재는 env.ADMIN_TOKEN 헤더 검증.
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
  const manual = getStore().jobs.filter((j) => j.source === "수동");
  return Response.json({ ok: true, data: { total: manual.length, jobs: manual } });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "권한이 없어요." } },
      { status: 401 },
    );
  }

  let body: Partial<Job>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "JSON 형식이 잘못됐어요." } },
      { status: 400 },
    );
  }

  // 필수 필드 검사
  const required: (keyof Job)[] = [
    "title",
    "org",
    "regionName",
    "activityType",
    "wageKrwPerHour",
    "expiresAt",
    "applyUrl",
  ];
  for (const k of required) {
    if (!body[k]) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "MISSING_FIELD",
            message: `필수 항목 누락: ${k}`,
            field: k,
          },
        },
        { status: 400 },
      );
    }
  }

  const now = Date.now();
  const newJob: Job = {
    id: `j-manual-${now}`,
    source: "수동",
    sourceId: `MANUAL-${now}`,
    title: String(body.title),
    org: String(body.org),
    regionCode: String(body.regionCode ?? ""),
    regionName: String(body.regionName),
    lat: Number(body.lat ?? 0),
    lng: Number(body.lng ?? 0),
    jobTags: Array.isArray(body.jobTags) ? body.jobTags : [],
    activityType: body.activityType ?? "사회서비스형",
    difficulty: body.difficulty ?? "mid",
    outdoor: Boolean(body.outdoor),
    walkingHeavy: Boolean(body.walkingHeavy),
    drivingRequired: Boolean(body.drivingRequired),
    ageMin: Number(body.ageMin ?? 60),
    agePreferred: body.agePreferred ?? null,
    wageKrwPerHour: Number(body.wageKrwPerHour),
    hoursPerWeek: Number(body.hoursPerWeek ?? 0),
    timeSlot: body.timeSlot ?? "flexible",
    schedule: String(body.schedule ?? ""),
    requirements: Array.isArray(body.requirements) ? body.requirements : [],
    applyUrl: String(body.applyUrl),
    contactPhone: String(body.contactPhone ?? ""),
    expiresAt: String(body.expiresAt),
  };

  getStore().jobs.push(newJob);
  return Response.json({ ok: true, data: { job: newJob } });
}
