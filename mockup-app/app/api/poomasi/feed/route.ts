// GET /api/poomasi/feed?dong=xxx — 우리 동 커뮤니티 피드
import { NextRequest } from "next/server";
import { getDemoUserId, getStore, getUser } from "../../../lib/store";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }
  const dong = req.nextUrl.searchParams.get("dong") ?? user.dongCode;

  const all = getStore().poomasi;
  // 본인 동 실제 글 (시드 제외)
  const ownPosts = all.filter(
    (p) =>
      !p.isSeed && p.status === "open" && p.dongCode === dong && p.reportCount < 3,
  );
  // MVP — 시드 글은 콘텐츠 그대로, 표시 지역만 본인 동으로 swap
  const seedPosts = all
    .filter((p) => p.isSeed && p.status === "open" && p.reportCount < 3)
    .map((p) => ({ ...p, dongCode: dong, dongName: user.dongName }));
  const open = [...ownPosts, ...seedPosts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return Response.json({
    ok: true,
    data: {
      dongCode: dong,
      dongName: user.dongName,
      total: open.length,
      posts: open,
    },
  });
}
