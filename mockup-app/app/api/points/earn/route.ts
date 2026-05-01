// POST /api/points/earn — 활동 완료 → 포인트 적립
// body: { type: LedgerType, amount?: number, metadata?: object }
//
// 적립 정책 (4대통합서비스_구현계획서 §3.2 활동 카탈로그):
//   GAME=20, LEARN=10, WALK(per 1k steps)=10,
//   STAMP=50, CULTURE=200, EVENT=상이,
//   WELFARE(혜택신청)=100, JOB(신청=50/근무완료=200), POOMASI=100
import { NextRequest } from "next/server";
import { appendLedger, getBalance, getDemoUserId, getUser } from "../../../lib/store";
import type { LedgerType } from "../../../lib/types";

const DEFAULT_AMOUNT: Record<LedgerType, number> = {
  GAME: 20,
  LEARN: 10,
  WALK: 10,
  STAMP: 50,
  CULTURE: 200,
  EVENT: 50,
  WELFARE: 100,
  JOB: 50,
  POOMASI: 100,
  REDEEM: -1000,
  ADMIN_ADJUST: 0,
};

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  let body: { type?: LedgerType; amount?: number; metadata?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    // 빈 body 허용
  }

  const type = body.type;
  if (!type || !(type in DEFAULT_AMOUNT)) {
    return Response.json(
      { ok: false, error: { code: "INVALID_TYPE", message: "활동 타입이 잘못됐어요." } },
      { status: 400 },
    );
  }

  const amount = body.amount ?? DEFAULT_AMOUNT[type];
  const entry = appendLedger({
    userId,
    type,
    amount,
    metadata: body.metadata ?? {},
    source: type === "ADMIN_ADJUST" ? "ADMIN_CORRECTION" : "USER_ACTION",
  });

  return Response.json({
    ok: true,
    data: { entry, balance: getBalance(userId) },
  });
}
