// POST /api/profile/update — 마이페이지에서 인터뷰 항목을 부분 수정
// 보낸 필드만 반영, 다른 필드는 그대로.
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getDemoUserId, getStore } from "../../../lib/store";
import {
  getProfileOverride,
  saveProfileToCookie,
  type ProfileOverride,
} from "../../../lib/auth";
import type { UserProfile } from "../../../lib/types";

const REGIONS = [
  "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "강원특별자치도", "충청북도", "충청남도", "전북특별자치도",
  "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

const HOUSEHOLDS = ["single", "couple", "with_family"] as const;
const WELFARE_STATUS = ["basic_livelihood", "near_poverty", "none", "unknown"] as const;
const HOUSING_TYPES = ["owned", "jeonse", "monthly_rent", "public_rental", "unknown"] as const;

function err(field: string, code: string, message: string, status = 400) {
  return Response.json(
    { ok: false, error: { code, message, field } },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: Partial<UserProfile> & { jobPreferences?: UserProfile["jobPreferences"] };
  try {
    body = await req.json();
  } catch {
    return err("", "BAD_JSON", "요청 형식을 확인해주세요.");
  }

  // 사용자 검증
  const userId = getDemoUserId();
  const store = getStore();
  const existing = store.users.get(userId);
  if (!existing) {
    return err("", "USER_NOT_FOUND", "사용자를 찾을 수 없어요.", 404);
  }

  // 입력 필드별 검증 — 보낸 것만 반영
  const updated: UserProfile = { ...existing };

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (v.length === 0 || v.length > 30) {
      return err("name", "INVALID_NAME", "이름은 1~30자로 입력해주세요.");
    }
    updated.name = v;
  }

  if (body.birthYear !== undefined) {
    const y = Number(body.birthYear);
    const now = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1900 || y > now) {
      return err("birthYear", "INVALID_YEAR", "출생 연도를 확인해주세요.");
    }
    updated.birthYear = y;
  }

  if (body.birthMonth !== undefined) {
    const m = body.birthMonth === null ? null : Number(body.birthMonth);
    if (m !== null && (!Number.isInteger(m) || m < 1 || m > 12)) {
      return err("birthMonth", "INVALID_MONTH", "출생 월을 확인해주세요.");
    }
    updated.birthMonth = m;
  }

  if (body.region !== undefined) {
    const v = String(body.region);
    if (!REGIONS.includes(v)) {
      return err("region", "INVALID_REGION", "시·도를 다시 골라주세요.");
    }
    updated.region = v;
  }

  if (body.district !== undefined) {
    const v = String(body.district).trim();
    if (v.length === 0) {
      return err("district", "INVALID_DISTRICT", "시·군·구를 입력해주세요.");
    }
    updated.district = v;
  }

  if (body.household !== undefined) {
    if (!(HOUSEHOLDS as readonly string[]).includes(body.household as string)) {
      return err("household", "INVALID_HOUSEHOLD", "가구 형태를 다시 골라주세요.");
    }
    updated.household = body.household as UserProfile["household"];
  }

  if (body.householdSize !== undefined) {
    const n = Number(body.householdSize);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return err("householdSize", "INVALID_SIZE", "가구원 수는 1~10명으로 입력해주세요.");
    }
    updated.householdSize = n;
  }

  if (body.monthlyIncomeKrw !== undefined) {
    if (body.monthlyIncomeKrw === null) {
      updated.monthlyIncomeKrw = null;
    } else {
      const n = Number(body.monthlyIncomeKrw);
      if (!Number.isFinite(n) || n < 0) {
        return err("monthlyIncomeKrw", "INVALID_INCOME", "월 소득은 0 이상으로 입력해주세요.");
      }
      updated.monthlyIncomeKrw = n;
    }
  }

  if (body.welfareStatus !== undefined) {
    if (!(WELFARE_STATUS as readonly string[]).includes(body.welfareStatus as string)) {
      return err("welfareStatus", "INVALID_WELFARE_STATUS", "복지 상태를 다시 골라주세요.");
    }
    updated.welfareStatus = body.welfareStatus as UserProfile["welfareStatus"];
  }

  if (body.housingType !== undefined) {
    if (!(HOUSING_TYPES as readonly string[]).includes(body.housingType as string)) {
      return err("housingType", "INVALID_HOUSING_TYPE", "주거 형태를 다시 골라주세요.");
    }
    updated.housingType = body.housingType as UserProfile["housingType"];
  }

  if (body.hasDisability !== undefined) {
    updated.hasDisability = Boolean(body.hasDisability);
  }
  if (body.disabilityGrade !== undefined) {
    const v = body.disabilityGrade;
    if (v !== null && !["none", "mild", "severe", "unknown"].includes(v as string)) {
      return err("disabilityGrade", "INVALID_GRADE", "장애 등급을 다시 골라주세요.");
    }
    updated.disabilityGrade = v as UserProfile["disabilityGrade"];
  }
  if (body.isVeteran !== undefined) {
    updated.isVeteran = Boolean(body.isVeteran);
  }
  if (body.hasYoungChild !== undefined) {
    updated.hasYoungChild = Boolean(body.hasYoungChild);
  }

  if (body.jobPreferences !== undefined && body.jobPreferences) {
    updated.jobPreferences = {
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
      ...body.jobPreferences,
    };
  }

  store.users.set(userId, updated);

  // 쿠키 영속화 — 기존 override에 덮어쓰기
  const existingOverride = (await getProfileOverride()) ?? ({} as ProfileOverride);
  await saveProfileToCookie({
    ...existingOverride,
    name: updated.name,
    birthYear: updated.birthYear,
    birthMonth: updated.birthMonth,
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

  // onboarded 쿠키 유지 (이미 인터뷰 통과한 사용자)
  void cookies;

  return Response.json({ ok: true, data: { profile: updated } });
}
