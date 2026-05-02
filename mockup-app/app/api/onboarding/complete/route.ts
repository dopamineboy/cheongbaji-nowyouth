// POST /api/onboarding/complete
// 4단계 인터뷰 답변을 받아서 demo 사용자 프로필을 업데이트하고
// "온보딩 완료" 쿠키를 설정 → 이후 / 진입 시 게이트 통과.
//
// S2에서는 사용자 ID를 새로 발급(JWT) 하고 DB에 INSERT.
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getDemoUserId, getStore } from "../../../lib/store";
import type { JobActivityType, TimeSlot, UserProfile } from "../../../lib/types";
import { geocodeAddress, isKakaoAvailable } from "../../../lib/geo/kakao";
import { saveProfileToCookie, clearAllSessionCookies } from "../../../lib/auth";

const COOKIE_NAME = "cb_onboarded";
const COOKIE_TTL = 60 * 60 * 24 * 30; // 30일

interface OnboardingPayload {
  birthYear?: number;
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

const DONG_BY_DISTRICT: Record<string, { code: string; name: string; lat: number; lng: number }> = {
  "종로구": { code: "1111051500", name: "종로구 종로1·2·3·4가동", lat: 37.5703, lng: 126.9824 },
  "중구":   { code: "1114052000", name: "중구 회현동",            lat: 37.5589, lng: 126.9789 },
  "용산구": { code: "1117052000", name: "용산구 용산2가동",        lat: 37.5326, lng: 126.9909 },
  "성북구": { code: "1129052000", name: "성북구 성북동",            lat: 37.5894, lng: 127.0067 },
  "마포구": { code: "1144052000", name: "마포구 공덕동",            lat: 37.5440, lng: 126.9519 },
  "강남구": { code: "1168052000", name: "강남구 역삼1동",            lat: 37.5008, lng: 127.0367 },
  "송파구": { code: "1171052000", name: "송파구 잠실본동",            lat: 37.5145, lng: 127.0987 },
};

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

  const dong = body.district ? DONG_BY_DISTRICT[body.district] : null;

  // dongCode는 region+district 조합으로 표준화 — 비-서울 district도 고유 식별 보장
  // (이전엔 매핑 없으면 sampleUser의 종로 dongCode로 떨어져서 일산서구 사용자가 종로 시드 글 보던 버그 수정)
  const standardizedDongCode = body.region && body.district
    ? `R_${body.region}_${body.district}`.replace(/\s+/g, "_")
    : (dong?.code ?? existing.dongCode);

  // Kakao Geocoding 우선 → 실패 시 정적 매핑 → 그것도 없으면 sampleUser 좌표
  let geoLat = dong?.lat ?? existing.lat;
  let geoLng = dong?.lng ?? existing.lng;
  let resolvedDongName = dong?.name ?? `${body.region ?? ""} ${body.district ?? ""}`.trim();
  const resolvedDongCode = standardizedDongCode;

  if (isKakaoAvailable() && body.region && body.district) {
    const fullAddr = `${body.region} ${body.district}`;
    const geo = await geocodeAddress(fullAddr);
    if (geo) {
      geoLat = geo.lat;
      geoLng = geo.lng;
      // 카카오가 반환한 매칭된 주소명 사용 (더 정확)
      if (geo.matchedAddress) resolvedDongName = geo.matchedAddress;
    }
  }

  const updated: UserProfile = {
    ...existing,
    birthYear: body.birthYear,
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
