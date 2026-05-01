// GET /api/jobs/search — 사용자 매칭 + 단순 검색 둘 다 지원
import { NextRequest } from "next/server";
import { matchJobsForUser, scoreJob, passHardFilter } from "../../../lib/jobs/match";
import { getDemoUserId, getStore, getUser } from "../../../lib/store";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const kw = req.nextUrl.searchParams.get("kw")?.trim() ?? "";
  const mode = req.nextUrl.searchParams.get("mode") ?? "match"; // match | search

  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  const allJobs = getStore().jobs;

  if (mode === "search") {
    // 키워드 검색 — 모든 활성 공고에서 검색
    const now = new Date();
    const filtered = allJobs.filter((j) => {
      if (new Date(j.expiresAt).getTime() < now.getTime()) return false;
      if (!kw) return true;
      const haystack = `${j.title} ${j.org} ${j.jobTags.join(" ")} ${j.activityType}`.toLowerCase();
      return haystack.includes(kw.toLowerCase());
    });
    const scored = filtered.map((j) => scoreJob(user, j));
    scored.sort((a, b) => b.score - a.score);
    return Response.json({ ok: true, data: { mode, total: scored.length, jobs: scored } });
  }

  // 기본: 3단계 매칭
  const top5 = matchJobsForUser(user, allJobs);
  return Response.json({
    ok: true,
    data: {
      mode: "match",
      total: top5.length,
      filteredOut: allJobs.length - allJobs.filter((j) => passHardFilter(user, j)).length,
      jobs: top5,
    },
  });
}
