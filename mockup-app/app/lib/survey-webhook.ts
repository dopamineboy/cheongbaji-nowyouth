// 설문 응답 → Google Sheets (Apps Script Web App) webhook 전송
//
// 환경변수:
//   SURVEY_WEBHOOK_URL    — Apps Script 배포 URL (https://script.google.com/macros/s/.../exec)
//   SURVEY_WEBHOOK_SECRET — Apps Script 측에서 검증하는 비밀 문자열 (선택)
//
// 미설정 시 no-op — 로컬·시연 환경에서 별도 설정 없이도 정상 작동.
// 실패해도 응답자 폼 제출에는 영향 주지 않도록 try/catch + 짧은 타임아웃.

import type { SurveyResponse } from "./types";

const TIMEOUT_MS = 8000;

export async function postSurveyToSheet(resp: SurveyResponse): Promise<void> {
  const baseUrl = process.env.SURVEY_WEBHOOK_URL;
  if (!baseUrl) return;

  const secret = process.env.SURVEY_WEBHOOK_SECRET;
  const url = secret
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}`
    : baseUrl;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Apps Script는 doPost 호출 시 자동 리다이렉트 응답 가능 — follow
      redirect: "follow",
    });
    if (!res.ok) {
      console.warn(`[survey-webhook] non-ok status ${res.status}`);
    }
  } catch (err) {
    console.warn("[survey-webhook] failed:", err);
  }
}
