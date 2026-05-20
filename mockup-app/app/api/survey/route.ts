// POST /api/survey — MVP 개선 의견 수집 설문 응답 저장 (12문항 다단계)
// GET  /api/survey — 최근 응답 목록 (관리/시연용)
import { NextRequest } from "next/server";
import { addSurveyResponse, listSurveyResponses } from "../../lib/store";
import type {
  SurveyAgeBand,
  SurveyDevice,
  SurveyPainPoint,
  SurveyUsagePeriod,
} from "../../lib/types";

const AGE_BANDS: SurveyAgeBand[] = [
  "60-64",
  "65-69",
  "70-74",
  "75-79",
  "80+",
  "prefer_not",
];
const USAGE_PERIODS: SurveyUsagePeriod[] = [
  "first",
  "days",
  "weeks",
  "month_plus",
];
const DEVICES: SurveyDevice[] = ["phone", "tablet", "pc"];
const PAIN_POINTS: SurveyPainPoint[] = [
  "font_small",
  "slow_loading",
  "button_layout",
  "guide_unclear",
  "accuracy",
  "voice_needed",
  "other",
];

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function err(field: string, code: string, message: string, status = 400) {
  return Response.json(
    { ok: false, error: { code, message, field } },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: {
    userId?: string | null;
    ageBand?: SurveyAgeBand;
    usagePeriod?: SurveyUsagePeriod;
    device?: SurveyDevice;
    nps?: number;
    overallSatisfaction?: number;
    scoreWelfare?: number | null;
    scoreJobs?: number | null;
    scoreActivity?: number | null;
    scoreCommunity?: number | null;
    painPoints?: SurveyPainPoint[];
    painPointDetail?: string;
    freeFeedback?: string;
    contactEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return err("", "BAD_JSON", "요청 형식을 확인해주세요.");
  }

  // Step 1 — 기본 정보 (Q3 device 선택)
  if (!body.ageBand || !AGE_BANDS.includes(body.ageBand)) {
    return err("ageBand", "INVALID_AGE", "연령대를 골라 주세요.");
  }
  if (!body.usagePeriod || !USAGE_PERIODS.includes(body.usagePeriod)) {
    return err("usagePeriod", "INVALID_USAGE", "청바지 사용 기간을 골라 주세요.");
  }
  if (body.device !== undefined && !DEVICES.includes(body.device)) {
    return err("device", "INVALID_DEVICE", "사용 기기 선택이 올바르지 않아요.");
  }

  // Step 2 — 전체 평가
  if (!isInt(body.nps, 0, 10)) {
    return err(
      "nps",
      "INVALID_NPS",
      "추천 점수를 0~10에서 골라 주세요.",
    );
  }
  if (!isInt(body.overallSatisfaction, 1, 5)) {
    return err(
      "overallSatisfaction",
      "INVALID_SATISFACTION",
      "전체 만족도를 1~5점에서 골라 주세요.",
    );
  }

  // Step 3 — 화면별 점수 (각각 1~5 정수 또는 null)
  const screenKey = ["scoreWelfare", "scoreJobs", "scoreActivity", "scoreCommunity"] as const;
  for (const k of screenKey) {
    const v = body[k];
    if (v !== null && v !== undefined && !isInt(v, 1, 5)) {
      return err(k, "INVALID_SCORE", "화면 점수는 1~5점 또는 사용 안 했어요여야 해요.");
    }
  }

  // Step 4 — 페인포인트 enum 검증
  const painPoints = Array.isArray(body.painPoints) ? body.painPoints : [];
  for (const p of painPoints) {
    if (!PAIN_POINTS.includes(p)) {
      return err("painPoints", "INVALID_PAIN_POINT", "선택한 항목이 올바르지 않아요.");
    }
  }

  const painPointDetail = (body.painPointDetail ?? "").trim();
  const freeFeedback = (body.freeFeedback ?? "").trim();
  // 페인포인트 1개라도 골랐거나, 자유 의견을 적었거나 둘 중 하나는 필요
  if (painPoints.length === 0 && freeFeedback.length === 0) {
    return err(
      "freeFeedback",
      "EMPTY_FEEDBACK",
      "아쉬웠던 점 한 가지를 고르시거나, 마지막 한마디를 적어 주세요.",
    );
  }

  const saved = addSurveyResponse({
    userId: body.userId ?? null,
    ageBand: body.ageBand,
    usagePeriod: body.usagePeriod,
    device: body.device,
    nps: body.nps,
    overallSatisfaction: body.overallSatisfaction,
    scoreWelfare: body.scoreWelfare ?? null,
    scoreJobs: body.scoreJobs ?? null,
    scoreActivity: body.scoreActivity ?? null,
    scoreCommunity: body.scoreCommunity ?? null,
    painPoints,
    painPointDetail,
    freeFeedback,
    contactEmail: (body.contactEmail ?? "").trim() || undefined,
  });

  return Response.json({ ok: true, data: { response: saved } });
}

export async function GET() {
  const responses = listSurveyResponses(50);
  return Response.json({
    ok: true,
    data: { count: responses.length, responses },
  });
}
