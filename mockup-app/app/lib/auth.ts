// 온보딩 게이트 헬퍼 (서버 컴포넌트용)
import { cookies } from "next/headers";

const COOKIE_NAME = "cb_onboarded";

export async function isOnboarded(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "1";
}
