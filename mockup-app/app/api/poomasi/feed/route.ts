// GET /api/poomasi/feed?dong=xxx — 우리 동 품앗이 피드
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
  const open = all
    .filter((p) => p.status === "open" && p.dongCode === dong && p.reportCount < 3)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
