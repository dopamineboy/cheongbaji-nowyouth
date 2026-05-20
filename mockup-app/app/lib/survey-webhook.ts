// 설문 응답 → Google Sheets (Apps Script Web App) webhook 전송
//
// 환경변수:
//   SURVEY_WEBHOOK_URL    — Apps Script 배포 URL (https://script.google.com/macros/s/.../exec)
//   SURVEY_WEBHOOK_SECRET — Apps Script 측에서 검증하는 비밀 문자열 (선택)
//
// 미설정 시 no-op — 로컬·시연 환경에서 별도 설정 없이도 정상 작동.
// 실패해도 응답자 폼 제출에는 영향 주지 않도록 try/catch + 짧은 타임아웃.

import type { SurveyResponse } from "./types";

const TIMEOUT_MS = 25_000; // Apps Script cold start 대응

export async function postSurveyToSheet(resp: SurveyResponse): Promise<void> {
  const baseUrl = process.env.SURVEY_WEBHOOK_URL;
  if (!baseUrl) return;

  const secret = process.env.SURVEY_WEBHOOK_SECRET;
  const url = secret
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret)}`
    : baseUrl;

  try {
    // Apps Script는 doPost 본문(시트 append)을 즉시 실행하고 응답으로 302를 반환.
    // redirect: "manual" 로 302만 받고 종료 → redirect chain의 hang 방지.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
    // Apps Script는 정상 처리 시 302 redirect를 보냄. status 0(opaqueredirect) 또는 200대 모두 정상으로 간주.
    if (res.status >= 400) {
      console.warn(`[survey-webhook] non-ok status ${res.status}`);
    } else {
      console.log(`[survey-webhook] sent ok (status ${res.status})`);
    }
  } catch (err) {
    console.warn("[survey-webhook] failed:", err);
  }
}
