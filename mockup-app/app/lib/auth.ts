// 온보딩 게이트 + 프로필 영속화 헬퍼 (서버 컴포넌트용)
//
// Vercel serverless는 매 cold start마다 globalThis 인메모리 store가 리셋됨.
// 따라서 사용자 입력 프로필을 "cb_profile" 쿠키(JSON)에 영속화해서 매 요청마다 복원.
import { cookies } from "next/headers";
import type { UserProfile } from "./types";

const ONBOARDED_COOKIE = "cb_onboarded";
const PROFILE_COOKIE = "cb_profile";

export async function isOnboarded(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ONBOARDED_COOKIE)?.value === "1";
}

export type ProfileOverride = Partial<
  Pick<
    UserProfile,
    | "name"
    | "birthYear"
    | "birthMonth"
    | "region"
    | "district"
    | "dongCode"
    | "dongName"
    | "household"
    | "householdSize"
    | "monthlyIncomeKrw"
    | "welfareStatus"
    | "hasDisability"
    | "disabilityGrade"
    | "isVeteran"
    | "hasYoungChild"
    | "hasWorkAbility"
    | "housingType"
    | "delinquencies"
    | "healthConcerns"
    | "lat"
    | "lng"
    | "jobPreferences"
  >
>;

/** 쿠키에서 사용자 프로필 override를 읽어옴 */
export async function getProfileOverride(): Promise<ProfileOverride | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PROFILE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded) as ProfileOverride;
  } catch {
    return null;
  }
}

/** 쿠키에 사용자 프로필 저장 (온보딩 완료 시) */
export async function saveProfileToCookie(override: ProfileOverride): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, encodeURIComponent(JSON.stringify(override)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

/** 기본 사용자 + 쿠키 override 병합 — Vercel cold start 후에도 입력값 유지 */
export function applyOverride(
  base: UserProfile,
  override: ProfileOverride | null,
): UserProfile {
  if (!override) return base;
  return {
    ...base,
    ...override,
    jobPreferences: {
      ...(base.jobPreferences ?? {
        preferredJobTypes: [],
        pastOccupations: [],
        maxCommuteMinutes: 30,
        preferredTimeSlots: ["morning"],
        desiredHourlyWageKrw: null,
        outdoorOk: false,
        walkingHeavyOk: true,
        drivingOk: false,
      }),
      ...(override.jobPreferences ?? {}),
    },
  };
}

export async function clearAllSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDED_COOKIE);
  cookieStore.delete(PROFILE_COOKIE);
}
