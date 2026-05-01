// GET /api/welfare/match — 도우다 matcher 기반 매칭
// 25개 YAML 복지 프로그램 + 4단계 상태 (eligible / likely_eligible / needs_more_info / ineligible)
import { NextRequest } from "next/server";
import { getDemoUserId, getUser } from "../../../lib/store";
import { loadAllBenefits } from "../../../lib/welfare/content";
import { matchBenefits, totalEligibleAmount } from "../../../lib/welfare/matcher";
import { toWelfareProfile } from "../../../lib/welfare/adapter";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }
  const benefits = loadAllBenefits();
  const matched = matchBenefits(toWelfareProfile(user), benefits);

  return Response.json({
    ok: true,
    data: {
      total: matched.length,
      eligibleCount: matched.filter((m) => m.status === "eligible").length,
      likelyCount: matched.filter((m) => m.status === "likely_eligible").length,
      needsInfoCount: matched.filter((m) => m.status === "needs_more_info").length,
      ineligibleCount: matched.filter((m) => m.status === "ineligible").length,
      totalEligibleAmountKrw: totalEligibleAmount(matched),
      programs: matched,
    },
  });
}
