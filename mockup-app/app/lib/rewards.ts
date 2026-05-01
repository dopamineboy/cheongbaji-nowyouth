// 리워드 카탈로그 (S1: 수기 발송 / S2: 카카오 기프티콘 자동 발급)
import type { LedgerEntry } from "./types";

export interface RewardItem {
  id: string;
  name: string;
  costP: number;
  category: "convenience" | "drug" | "culture" | "food";
  icon: string;
  brand: string;
  description: string;
  fulfillmentS1: string; // S1 처리 방식
}

export const rewards: RewardItem[] = [
  {
    id: "r-cu-1k",
    name: "CU 편의점 1,000원권",
    costP: 1000,
    category: "convenience",
    icon: "🏪",
    brand: "CU",
    description: "전국 CU에서 음료·간식 구매 가능",
    fulfillmentS1: "월 1회 우편 발송",
  },
  {
    id: "r-gs-1k",
    name: "GS25 1,000원권",
    costP: 1000,
    category: "convenience",
    icon: "🏪",
    brand: "GS25",
    description: "GS25 음료·도시락 등",
    fulfillmentS1: "월 1회 우편 발송",
  },
  {
    id: "r-pharmacy-2k",
    name: "약국 비타민 교환권 2,000원",
    costP: 2000,
    category: "drug",
    icon: "💊",
    brand: "온누리약국",
    description: "건강식품·비타민 구매",
    fulfillmentS1: "약국 방문 시 사용",
  },
  {
    id: "r-bakery-3k",
    name: "동네 빵집 3,000원권",
    costP: 3000,
    category: "food",
    icon: "🥐",
    brand: "파리바게뜨/뚜레쥬르",
    description: "빵·케이크 구매 가능",
    fulfillmentS1: "지정 매장 방문",
  },
  {
    id: "r-museum-5k",
    name: "박물관 카페 음료권 5,000원",
    costP: 5000,
    category: "culture",
    icon: "☕",
    brand: "서울역사박물관",
    description: "관람 후 차 한 잔",
    fulfillmentS1: "현장 사용",
  },
  {
    id: "r-localprod-10k",
    name: "지자체 특산품 교환권 10,000원",
    costP: 10000,
    category: "food",
    icon: "🎁",
    brand: "종로구 직매장",
    description: "구청 지정 직매장 농산물",
    fulfillmentS1: "구청 협업 (S2 정식 출시)",
  },
];

export function isRedeemable(balance: number, item: RewardItem): boolean {
  return balance >= item.costP;
}

export function totalRedeemed(ledger: LedgerEntry[]): number {
  return ledger
    .filter((e) => e.type === "REDEEM")
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);
}
