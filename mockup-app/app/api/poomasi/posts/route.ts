// POST /api/poomasi/posts — 새 품앗이 글 작성
// body: { category, title, body, preferredTime }
import { NextRequest } from "next/server";
import { addPoomasiPost, getDemoUserId, getUser } from "../../../lib/store";
import type { PoomasiCategory } from "../../../lib/types";

const ALLOWED_CATEGORIES: PoomasiCategory[] = [
  "life_help",
  "house_chore",
  "digital",
  "talk",
  "skill_share",
  "etc",
];

// 금지 키워드 — 게시 차단 (4대통합서비스_구현계획서 §5.4)
const BLOCKED_KEYWORDS = ["대출", "투자", "비트코인", "선교", "포교", "후원금"];

function maskName(name: string): string {
  if (name.length < 2) return name;
  return name[0] + "○".repeat(name.length - 1);
}

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  let body: {
    category?: PoomasiCategory;
    title?: string;
    body?: string;
    preferredTime?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "요청 형식을 확인해주세요." } },
      { status: 400 },
    );
  }

  const { category, title, body: postBody, preferredTime } = body;
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return Response.json(
      { ok: false, error: { code: "INVALID_CATEGORY", message: "카테고리를 다시 선택해주세요.", field: "category" } },
      { status: 400 },
    );
  }
  if (!title || title.trim().length < 3) {
    return Response.json(
      { ok: false, error: { code: "INVALID_TITLE", message: "제목을 3자 이상 적어주세요.", field: "title" } },
      { status: 400 },
    );
  }
  if (!postBody || postBody.trim().length < 5) {
    return Response.json(
      { ok: false, error: { code: "INVALID_BODY", message: "내용을 5자 이상 적어주세요.", field: "body" } },
      { status: 400 },
    );
  }

  const haystack = `${title} ${postBody}`.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (haystack.includes(kw)) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "BLOCKED_KEYWORD",
            message: "금융·종교·후원 관련 글은 등록할 수 없어요.",
          },
        },
        { status: 400 },
      );
    }
  }

  const post = addPoomasiPost({
    authorId: user.id,
    authorName: user.name,
    authorMaskedName: maskName(user.name),
    dongCode: user.dongCode,
    dongName: user.dongName,
    category,
    title: title.trim(),
    body: postBody.trim(),
    preferredTime: (preferredTime ?? "").trim(),
  });

  return Response.json({ ok: true, data: { post } });
}
