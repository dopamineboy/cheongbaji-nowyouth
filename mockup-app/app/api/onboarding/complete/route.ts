// POST /api/onboarding/complete
// 4단계 인터뷰 답변을 받아서 demo 사용자 프로필을 업데이트하고
// "온보딩 완료" 쿠키를 설정 → 이후 / 진입 시 게이트 통과.
//
// S2에서는 사용자 ID를 새로 발급(JWT) 하고 DB에 INSERT.
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getDemoUserId, getStore } from "../../../lib/store";
import type { JobActivityType, TimeSlot, UserProfile } from "../../../lib/types";
import { resolveLocation } from "../../../lib/geo/resolve-location";
import { saveProfileToCookie, clearAllSessionCookies } from "../../../lib/auth";

const COOKIE_NAME = "cb_onboarded";
const COOKIE_TTL = 60 * 60 * 24 * 30; // 30일

interface OnboardingPayload {
  birthYear?: number;
  birthMonth?: number | null;
  region?: string;
  district?: string;
  household?: "single" | "couple" | "with_family";
  householdSize?: number;
  monthlyIncomeKrw?: number | null;
  outdoorOk?: boolean;
  walkingHeavyOk?: boolean;
  daysPerWeek?: number;
  preferredJobTypes?: JobActivityType[];
  pastOccupations?: string[];
  preferredTimeSlots?: TimeSlot[];
  desiredHourlyWageKrw?: number | null;
  name?: string;
}

// DONG_BY_DISTRICT 정적 매핑은 lib/geo/resolve-location.ts로 이동됨 (profile/update와 공유)

export async function POST(req: NextRequest) {
  let body: OnboardingPayload = {};
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "요청 형식을 확인해주세요." } },
      { status: 400 },
    );
  }

  if (!body.birthYear || !body.region) {
    return Response.json(
      {
        ok: false,
        error: { code: "MISSING_REQUIRED", message: "출생연도·거주지는 꼭 입력해주세요." },
      },
      { status: 400 },
    );
  }

  // demo 사용자 프로필을 입력값으로 갱신
  const userId = getDemoUserId();
  const store = getStore();
  const existing = store.users.get(userId);
  if (!existing) {
    return Response.json(
      { ok: false, error: { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없어요." } },
      { status: 404 },
    );
  }

  // region/district → 좌표·dongCode 결정 (Kakao 우선, 서울 자치구 정적 매핑 폴백)
  const located = await resolveLocation(body.region, body.district, {
    dongCode: existing.dongCode,
    dongName: existing.dongName,
    lat: existing.lat,
    lng: existing.lng,
  });
  const resolvedDongCode = located.dongCode;
  const resolvedDongName = located.dongName;
  const geoLat = located.lat;
  const geoLng = located.lng;

  // 출생월 검증 (1~12 또는 null)
  const birthMonth =
    typeof body.birthMonth === "number" && body.birthMonth >= 1 && body.birthMonth <= 12
      ? body.birthMonth
      : null;

  const updated: UserProfile = {
    ...existing,
    birthYear: body.birthYear,
    birthMonth,
    name: body.name?.trim() || existing.name,
    region: body.region,
    district: body.district ?? existing.district,
    household: body.household ?? existing.household,
    householdSize: body.householdSize ?? existing.householdSize,
    monthlyIncomeKrw:
      body.monthlyIncomeKrw === undefined
        ? existing.monthlyIncomeKrw
        : body.monthlyIncomeKrw,
    dongCode: resolvedDongCode,
    dongName: resolvedDongName,
    lat: geoLat,
    lng: geoLng,
    jobPreferences: {
      ...(existing.jobPreferences ?? {
        preferredJobTypes: [],
        pastOccupations: [],
        maxCommuteMinutes: 30,
        preferredTimeSlots: ["morning"],
        desiredHourlyWageKrw: null,
        outdoorOk: false,
        walkingHeavyOk: true,
        drivingOk: false,
      }),
      preferredJobTypes:
        body.preferredJobTypes ?? existing.jobPreferences?.preferredJobTypes ?? [],
      pastOccupations:
        body.pastOccupations ?? existing.jobPreferences?.pastOccupations ?? [],
      preferredTimeSlots:
        body.preferredTimeSlots ??
        existing.jobPreferences?.preferredTimeSlots ?? ["morning"],
      desiredHourlyWageKrw:
        body.desiredHourlyWageKrw === undefined
          ? existing.jobPreferences?.desiredHourlyWageKrw ?? null
          : body.desiredHourlyWageKrw,
      outdoorOk: body.outdoorOk ?? existing.jobPreferences?.outdoorOk ?? false,
      walkingHeavyOk:
        body.walkingHeavyOk ?? existing.jobPreferences?.walkingHeavyOk ?? true,
    },
  };
  store.users.set(userId, updated);

  // 온보딩 완료 쿠키
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_TTL,
    path: "/",
  });

  // 프로필을 쿠키에 영속화 — Vercel cold start 시 in-memory store 리셋되어도 복원
  await saveProfileToCookie({
    name: updated.name,
    birthYear: updated.birthYear,
    birthMonth: updated.birthMonth,
    welfareStatus: updated.welfareStatus,
    hasDisability: updated.hasDisability,
    disabilityGrade: updated.disabilityGrade,
    isVeteran: updated.isVeteran,
    hasYoungChild: updated.hasYoungChild,
    hasWorkAbility: updated.hasWorkAbility,
    housingType: updated.housingType,
    delinquencies: updated.delinquencies,
    healthConcerns: updated.healthConcerns,
    region: updated.region,
    district: updated.district,
    dongCode: updated.dongCode,
    dongName: updated.dongName,
    household: updated.household,
    householdSize: updated.householdSize,
    monthlyIncomeKrw: updated.monthlyIncomeKrw,
    lat: updated.lat,
    lng: updated.lng,
    jobPreferences: updated.jobPreferences,
  });

  return Response.json({ ok: true, data: { userId, profile: updated } });
}

export async function DELETE() {
  // 온보딩 리셋 (테스트·재인터뷰용) — 프로필도 함께 삭제
  await clearAllSessionCookies();
  return Response.json({ ok: true });
}
