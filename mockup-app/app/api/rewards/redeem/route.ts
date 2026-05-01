// POST /api/rewards/redeem — 포인트 → 리워드 교환
// body: { itemId }
// 잔액 부족 시 400, 성공 시 ledger에 REDEEM(-amount) 기록
import { NextRequest } from "next/server";
import {
  appendLedger,
  getBalance,
  getDemoUserId,
  getUser,
} from "../../../lib/store";
import { rewards } from "../../../lib/rewards";

export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? getDemoUserId();
  const user = getUser(userId);
  if (!user) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  let body: { itemId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "요청을 다시 확인해주세요." } },
      { status: 400 },
    );
  }

  const item = rewards.find((r) => r.id === body.itemId);
  if (!item) {
    return Response.json(
      { ok: false, error: { code: "ITEM_NOT_FOUND", message: "리워드를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  const balance = getBalance(userId);
  if (balance < item.costP) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "INSUFFICIENT_POINTS",
          message: `포인트가 ${(item.costP - balance).toLocaleString()}P 부족해요.`,
        },
      },
      { status: 400 },
    );
  }

  const entry = appendLedger({
    userId,
    type: "REDEEM",
    amount: -item.costP,
    metadata: { itemId: item.id, itemName: item.name },
    source: "USER_ACTION",
  });

  return Response.json({
    ok: true,
    data: {
      entry,
      balance: getBalance(userId),
      fulfillment: item.fulfillmentS1,
    },
  });
}
