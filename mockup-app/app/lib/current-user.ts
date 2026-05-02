// 현재 사용자 조회 헬퍼 — base 사용자 + 쿠키 override 병합
// Vercel serverless cold start 후에도 사용자 입력 데이터 복원
import { applyOverride, getProfileOverride } from "./auth";
import { getDemoUserId, getUser } from "./store";
import type { UserProfile } from "./types";

export async function getCurrentUser(): Promise<UserProfile | null> {
  const base = getUser(getDemoUserId());
  if (!base) return null;
  const override = await getProfileOverride();
  return applyOverride(base, override);
}
