// POST /api/survey — MVP 개선 의견 수집 설문 응답 저장
// GET  /api/survey — 최근 응답 목록 (관리/시연용)
import { NextRequest } from "next/server";
import { addSurveyResponse, listSurveyResponses } from "../../lib/store";
import type { SurveySection } from "../../lib/types";

const VALID_SECTIONS: SurveySection[] = [
  "welfare",
  "jobs",
  "activity",
  "community",
  "none",
];

export async function POST(req: NextRequest) {
  let body: {
    userId?: string | null;
    overallSatisfaction?: number;
    mostUsefulSection?: SurveySection;
    weakestPoint?: string;
    wouldRecommend?: boolean | null;
    freeFeedback?: string;
    contactEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "요청 형식을 확인해주세요." } },
      { status: 400 },
    );
  }

  const sat = Number(body.overallSatisfaction);
  if (!Number.isInteger(sat) || sat < 1 || sat > 5) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "INVALID_SATISFACTION",
          message: "전체 만족도를 1~5점에서 골라 주세요.",
          field: "overallSatisfaction",
        },
      },
      { status: 400 },
    );
  }

  const section = body.mostUsefulSection;
  if (!section || !VALID_SECTIONS.includes(section)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "INVALID_SECTION",
          message: "가장 도움이 된 화면을 골라 주세요.",
          field: "mostUsefulSection",
        },
      },
      { status: 400 },
    );
  }

  const weakest = (body.weakestPoint ?? "").trim();
  const feedback = (body.freeFeedback ?? "").trim();
  if (weakest.length === 0 && feedback.length === 0) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "EMPTY_FEEDBACK",
          message: "개선 의견을 한 줄이라도 적어 주세요.",
          field: "freeFeedback",
        },
      },
      { status: 400 },
    );
  }

  const saved = addSurveyResponse({
    userId: body.userId ?? null,
    overallSatisfaction: sat,
    mostUsefulSection: section,
    weakestPoint: weakest,
    wouldRecommend:
      typeof body.wouldRecommend === "boolean" ? body.wouldRecommend : null,
    freeFeedback: feedback,
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
