// GET /api/survey/stats — 어드민 대시보드용 집계
import { computeSurveyStats } from "../../../lib/store";

export async function GET() {
  return Response.json({ ok: true, data: computeSurveyStats() });
}
