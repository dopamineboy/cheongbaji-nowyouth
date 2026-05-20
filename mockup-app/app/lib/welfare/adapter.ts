// 청바지 통합 UserProfile → 도우다 WelfareUserProfile 변환
import { calculateAge } from "../age";
import type { UserProfile } from "../types";
import type { WelfareUserProfile } from "./matcher";

export function toWelfareProfile(user: UserProfile): WelfareUserProfile {
  // 만 나이 정밀 계산 — birthMonth가 있으면 생일 지났는지까지 반영
  const age = calculateAge(user.birthYear, user.birthMonth);
  return {
    age,
    household:
      user.household === "single"
        ? "single"
        : user.household === "couple"
        ? "couple"
        : "with_family",
    householdSize: user.householdSize,
    monthlyIncomeKrw: user.monthlyIncomeKrw ?? undefined,
    welfareStatus: user.welfareStatus,
    hasDisability: user.hasDisability,
    disabilityGrade: user.disabilityGrade,
    isVeteran: user.isVeteran,
    hasYoungChild: user.hasYoungChild,
    hasWorkAbility: user.hasWorkAbility,
    healthConcerns: user.healthConcerns,
    housingType: user.housingType,
    delinquencies: user.delinquencies,
    region: user.region,
    district: user.district,
    citizenship: user.citizenship,
  };
}
