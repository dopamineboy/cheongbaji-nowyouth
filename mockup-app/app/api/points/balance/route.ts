// GET /api/points/balance — 사용자 포인트 잔액 + 최근 거래
import { NextRequest } from "next/server";
import { getBalance, getDemoUserId, getLedger, getUser } from "../../../lib/store";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }
  return Response.json({
    ok: true,
    data: {
      balance: getBalance(userId),
      recent: getLedger(userId, 10),
    },
  });
}
