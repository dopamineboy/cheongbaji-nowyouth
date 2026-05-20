// GET /api/survey/export — 어드민용 CSV 다운로드
// UTF-8 BOM 포함 (엑셀에서 한글 깨짐 방지)
import { listSurveyResponses } from "../../../lib/store";

const COLUMNS = [
  "id",
  "createdAt",
  "ageBand",
  "usagePeriod",
  "device",
  "nps",
  "overallSatisfaction",
  "scoreWelfare",
  "scoreJobs",
  "scoreActivity",
  "scoreCommunity",
  "painPoints",
  "painPointDetail",
  "freeFeedback",
  "contactEmail",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // 따옴표·콤마·개행 포함 시 따옴표로 감싸고 내부 따옴표는 두 개로
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const rows = listSurveyResponses(10_000);

  const header = COLUMNS.join(",");
  const body = rows
    .map((r) =>
      COLUMNS.map((c) => {
        if (c === "painPoints") return csvEscape((r.painPoints ?? []).join("|"));
        return csvEscape((r as unknown as Record<string, unknown>)[c]);
      }).join(","),
    )
    .join("\n");

  // BOM + CRLF (엑셀 한글 호환)
  const csv = "﻿" + header + "\r\n" + body.replace(/\n/g, "\r\n");

  const filename = `cheongbaji-survey-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
