// GET /api/survey/export — 어드민용 CSV 다운로드
// UTF-8 BOM + CRLF (엑셀 한글 호환)
import { listSurveyResponses } from "../../../lib/store";
import { SURVEY_CHOICE_KEYS, type SurveyResponse } from "../../../lib/types";

// 객관식 10문항은 각각 _choice, _etc 두 컬럼으로 펼침
const CHOICE_HEADERS = SURVEY_CHOICE_KEYS.flatMap((k) => [k, `${k}_etc`]);
const HEADERS = [
  "id",
  "createdAt",
  ...CHOICE_HEADERS,
  "q11_liked",
  "q12_disliked",
  "q13_oneChange",
  "contactEmail",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowFor(r: SurveyResponse): string[] {
  const row: string[] = [csvEscape(r.id), csvEscape(r.createdAt)];
  for (const k of SURVEY_CHOICE_KEYS) {
    const a = r[k];
    row.push(csvEscape(a?.choice ?? ""));
    row.push(csvEscape(a?.etc ?? ""));
  }
  row.push(csvEscape(r.q11_liked));
  row.push(csvEscape(r.q12_disliked));
  row.push(csvEscape(r.q13_oneChange));
  row.push(csvEscape(r.contactEmail ?? ""));
  return row;
}

export async function GET() {
  const rows = listSurveyResponses(10_000);

  const header = HEADERS.join(",");
  const body = rows.map((r) => rowFor(r).join(",")).join("\r\n");

  const csv = "﻿" + header + "\r\n" + body;

  const filename = `cheongbaji-survey-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
