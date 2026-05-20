// POST /api/survey — 앱 사용 설문 (객관식 10 + 서술 3)
// GET  /api/survey — 최근 응답 목록 (관리/시연용)
import { NextRequest } from "next/server";
import { addSurveyResponse, listSurveyResponses } from "../../lib/store";
import { postSurveyToSheet } from "../../lib/survey-webhook";
import {
  SURVEY_CHOICE_KEYS,
  type SurveyChoice,
  type SurveyChoiceKey,
  type SurveyQuestionAnswer,
} from "../../lib/types";

const CHOICE_LABEL: Record<SurveyChoiceKey, string> = {
  q1_ease: "사용 쉬움",
  q2_understanding: "앱 이해",
  q3_findFeature: "기능 찾기",
  q4_confusion: "헷갈림",
  q5_readability: "글씨·화면",
  q6_buttons: "버튼",
  q7_mistakes: "실수",
  q8_selfUse: "혼자 다시",
  q9_satisfaction: "전반 만족",
  q10_continue: "계속 사용",
};

const MAX_ETC_LEN = 300;
const MAX_FREE_LEN = 500;

function isChoice(v: unknown): v is SurveyChoice {
  return v === 1 || v === 2 || v === 3;
}

function err(field: string, code: string, message: string, status = 400) {
  return Response.json(
    { ok: false, error: { code, message, field } },
    { status },
  );
}

function parseAnswer(
  raw: unknown,
  key: SurveyChoiceKey,
): SurveyQuestionAnswer | Response {
  if (!raw || typeof raw !== "object") {
    return err(
      key,
      "INVALID_ANSWER",
      `${CHOICE_LABEL[key]} 문항을 골라 주세요.`,
    );
  }
  const o = raw as { choice?: unknown; etc?: unknown };
  if (!isChoice(o.choice)) {
    return err(
      key,
      "INVALID_CHOICE",
      `${CHOICE_LABEL[key]} 문항에서 ①·②·③ 중 하나를 골라 주세요.`,
    );
  }
  let etc: string | undefined = undefined;
  if (o.etc !== undefined && o.etc !== null) {
    if (typeof o.etc !== "string") {
      return err(
        key,
        "INVALID_ETC",
        `${CHOICE_LABEL[key]} 기타 입력이 형식에 맞지 않아요.`,
      );
    }
    const trimmed = o.etc.trim();
    if (trimmed.length > MAX_ETC_LEN) {
      return err(
        key,
        "ETC_TOO_LONG",
        `${CHOICE_LABEL[key]} 기타 입력이 너무 길어요. (${MAX_ETC_LEN}자 이내)`,
      );
    }
    if (trimmed.length > 0) etc = trimmed;
  }
  return { choice: o.choice, etc };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return err("", "BAD_JSON", "요청 형식을 확인해주세요.");
  }

  // Q1~Q10 객관식 — 모두 필수
  const answers: Partial<Record<SurveyChoiceKey, SurveyQuestionAnswer>> = {};
  for (const k of SURVEY_CHOICE_KEYS) {
    const parsed = parseAnswer(body[k], k);
    if (parsed instanceof Response) return parsed;
    answers[k] = parsed;
  }

  // Q11~Q13 서술 — 최소 1개 필요
  const q11 = String((body.q11_liked ?? "")).trim();
  const q12 = String((body.q12_disliked ?? "")).trim();
  const q13 = String((body.q13_oneChange ?? "")).trim();

  if (q11.length === 0 && q12.length === 0 && q13.length === 0) {
    return err(
      "q11_liked",
      "EMPTY_FREE",
      "좋았던 점·불편했던 점·바꾸고 싶은 점 중 한 가지는 적어 주세요.",
    );
  }

  for (const [field, val] of [
    ["q11_liked", q11],
    ["q12_disliked", q12],
    ["q13_oneChange", q13],
  ] as const) {
    if (val.length > MAX_FREE_LEN) {
      return err(
        field,
        "FREE_TOO_LONG",
        `자유 응답이 너무 길어요. (${MAX_FREE_LEN}자 이내)`,
      );
    }
  }

  const saved = addSurveyResponse({
    userId: (body.userId as string | null | undefined) ?? null,
    q1_ease: answers.q1_ease!,
    q2_understanding: answers.q2_understanding!,
    q3_findFeature: answers.q3_findFeature!,
    q4_confusion: answers.q4_confusion!,
    q5_readability: answers.q5_readability!,
    q6_buttons: answers.q6_buttons!,
    q7_mistakes: answers.q7_mistakes!,
    q8_selfUse: answers.q8_selfUse!,
    q9_satisfaction: answers.q9_satisfaction!,
    q10_continue: answers.q10_continue!,
    q11_liked: q11,
    q12_disliked: q12,
    q13_oneChange: q13,
    contactEmail:
      typeof body.contactEmail === "string" && body.contactEmail.trim()
        ? body.contactEmail.trim()
        : undefined,
  });

  await postSurveyToSheet(saved);

  return Response.json({ ok: true, data: { response: saved } });
}

export async function GET() {
  const responses = listSurveyResponses(50);
  return Response.json({
    ok: true,
    data: { count: responses.length, responses },
  });
}
