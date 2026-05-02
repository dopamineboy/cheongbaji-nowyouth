/**
 * 청바지 — 복지 매칭 엔진
 * 도우다 프로젝트 lib/matcher.ts에서 포팅 + 청바지 통합 프로필과 결합.
 *
 * 설계 원칙
 *   - 순수 함수: 파일/네트워크 I/O 금지
 *   - "프로필에서 알 수 없는 것"은 단정하지 않고 needs_more_info로 분류
 *   - universal(누구나) 혜택은 별도로 분류
 */

// =====================================================================
// 타입 (douda 스키마와 호환)
// =====================================================================

export type Household = "single" | "couple" | "with_family" | "unknown";
export type HealthConcern = "teeth" | "eyes" | "daily_life" | "none";
export type HousingType =
  | "owned"
  | "jeonse"
  | "monthly_rent"
  | "public_rental"
  | "unknown";
export type DelinquencyType =
  | "maintenance"
  | "health_insurance"
  | "utility"
  | "none";
export type HealthTag = "teeth" | "eyes" | "daily_life";
export type WelfareStatus =
  | "basic_livelihood"
  | "near_poverty"
  | "none"
  | "unknown";

export interface WelfareUserProfile {
  age?: number;
  household: Household;
  householdSize?: number;
  monthlyIncomeKrw?: number;
  welfareStatus?: WelfareStatus;
  hasDisability?: boolean;
  healthConcerns?: HealthConcern[];
  housingType?: HousingType;
  delinquencies?: DelinquencyType[];
  region?: string; // 시·도 (예: "서울특별시")
  district?: string; // 시·군·구 (예: "종로구")
  citizenship?: string;
}

export interface BenefitEligibility {
  age_min?: number;
  age_max?: number;
  citizenship?: string;
  income_recognition_max?: Partial<Record<Household, number>>;
  median_income_pct?: number;
  requires_disability?: boolean;
  requires_crisis?: boolean;
  requires_renter?: boolean;
  regions?: string[];
  districts?: string[];
}

export interface ShowCondition {
  health_concerns?: HealthConcern[];
  has_delinquency?: boolean;
  has_disability?: boolean;
  is_renter?: boolean;
}

export interface BenefitAmount {
  type: string;
  amount_krw_max?: Partial<Record<Household, number>>;
}

export interface BenefitApply {
  online?: { name: string; url: string };
  offline?: string[];
}

export interface Benefit {
  id: string;
  name: string;
  agency: string;
  category: string;
  summary: string;
  eligibility: BenefitEligibility;
  benefit: BenefitAmount;
  documents: string[];
  apply: BenefitApply;
  sources: string[];
  last_verified: string;
  notes?: string;
  health_tags?: HealthTag[];
  delinquency_tags?: DelinquencyType[];
  universal?: boolean;
  show_condition?: ShowCondition;
  hidden_from_results?: boolean;
}

export type MatchStatus =
  | "eligible"
  | "likely_eligible"
  | "needs_more_info"
  | "ineligible";

export interface MatchedBenefit {
  benefit: Benefit;
  status: MatchStatus;
  reasons: string[];
  missing: string[];
  disclaimer: string;
  relevanceScore: number;
  totalConditions: number;
  metConditions: number;
  matchPct: number;
}

// =====================================================================
// 상수
// =====================================================================

const DEFAULT_DISCLAIMER =
  "여기 표시된 결과는 입력하신 정보 기반의 1차 안내예요. 최종 자격은 소득인정액·재산환산·가구특성 검토 후 주민센터·복지로에서 결정됩니다.";

// 2024년 기준 중위소득 (가구원 수별, 원/월) — 보건복지부 고시
const MEDIAN_INCOME_2024: Record<number, number> = {
  1: 2_228_445,
  2: 3_682_609,
  3: 4_714_657,
  4: 5_729_913,
  5: 6_695_735,
  6: 7_618_369,
};

function getIncomeThreshold(householdSize: number, pct: number): number {
  const size = Math.min(Math.max(householdSize, 1), 6);
  const median = MEDIAN_INCOME_2024[size] ?? MEDIAN_INCOME_2024[6];
  return Math.floor((median * pct) / 100);
}

// =====================================================================
// 메인
// =====================================================================

export function matchBenefits(
  profile: WelfareUserProfile,
  benefits: Benefit[],
): MatchedBenefit[] {
  const visible = benefits.filter((b) => shouldShow(profile, b));
  const results = visible.map((b) => evaluateBenefit(profile, b));
  return sortByHelpfulness(results);
}

function shouldShow(profile: WelfareUserProfile, benefit: Benefit): boolean {
  if (benefit.hidden_from_results) return false;
  const sc = benefit.show_condition;
  if (!sc) return true;

  if (sc.health_concerns && sc.health_concerns.length > 0) {
    const userHealth = profile.healthConcerns ?? [];
    const hasMatch = sc.health_concerns.some((h) => userHealth.includes(h));
    if (!hasMatch) return false;
  }
  if (sc.has_delinquency) {
    const has =
      profile.delinquencies &&
      profile.delinquencies.length > 0 &&
      !profile.delinquencies.includes("none");
    if (!has) return false;
  }
  if (sc.has_disability && !profile.hasDisability) return false;
  if (sc.is_renter) {
    const renterTypes: HousingType[] = ["jeonse", "monthly_rent", "public_rental"];
    if (!profile.housingType || !renterTypes.includes(profile.housingType)) return false;
  }
  return true;
}

function evaluateBenefit(
  profile: WelfareUserProfile,
  benefit: Benefit,
): MatchedBenefit {
  const reasons: string[] = [];
  const missing: string[] = [];
  let status: MatchStatus = "likely_eligible";
  let relevanceScore = 0;
  let totalConditions = 0;
  let metConditions = 0;

  const pass = (r: string) => {
    reasons.push(r);
    totalConditions++;
    metConditions++;
  };
  const fail = (r: string) => {
    reasons.push(r);
    status = "ineligible";
    totalConditions++;
  };
  const need = (label: string) => {
    if (!missing.includes(label)) missing.push(label);
    if (status !== "ineligible") status = "needs_more_info";
    totalConditions++;
  };

  const e = benefit.eligibility;

  // 국적
  if (e.citizenship) {
    const c = profile.citizenship ?? "KR";
    if (c !== e.citizenship) fail(`이 사업은 ${e.citizenship} 국적 어르신을 위한 제도예요.`);
    else pass("국적 조건을 충족하세요.");
  }

  // 나이
  if (e.age_min !== undefined || e.age_max !== undefined) {
    if (profile.age === undefined) need("만 나이");
    else if (e.age_min !== undefined && profile.age < e.age_min)
      fail(`만 ${e.age_min}세 이상부터 신청하실 수 있어요.`);
    else if (e.age_max !== undefined && profile.age > e.age_max)
      fail(`만 ${e.age_max}세까지 신청하실 수 있어요.`);
    else if (e.age_min !== undefined) pass(`만 ${e.age_min}세 이상 조건을 충족하세요.`);
  }

  // 장애
  if (e.requires_disability) {
    if (profile.hasDisability === undefined) need("장애 등록 여부");
    else if (!profile.hasDisability) fail("이 사업은 등록 장애인 어르신을 위한 제도예요.");
    else pass("장애 등록 조건을 충족하세요.");
  }

  // 거주지
  if (e.regions && e.regions.length > 0) {
    if (!profile.region) need("거주하시는 시·도");
    else if (!e.regions.includes(profile.region))
      fail(`이 사업은 ${e.regions.join(", ")} 거주 어르신만 신청할 수 있어요.`);
    else pass(`${profile.region} 거주 조건을 충족하세요.`);
  }
  if (e.districts && e.districts.length > 0) {
    if (!profile.district) need("거주하시는 시·군·구");
    else if (!e.districts.includes(profile.district))
      fail(`이 사업은 ${e.districts.join(", ")} 거주 분만 신청할 수 있어요.`);
    else pass(`${profile.district} 거주 조건을 충족하세요.`);
  }

  // 소득인정액
  if (e.income_recognition_max || e.median_income_pct) {
    const ws = profile.welfareStatus;
    if (ws === "basic_livelihood") {
      pass("기초생활수급자이시므로 소득 기준을 충족하세요.");
      relevanceScore += 3;
    } else if (ws === "near_poverty") {
      pass("차상위계층이시므로 소득 기준을 충족할 가능성이 높아요.");
      relevanceScore += 2;
    } else if (
      profile.monthlyIncomeKrw === undefined ||
      profile.householdSize === undefined
    ) {
      need("가구원 수와 가구 전체 한 달 소득");
    } else {
      let limit: number | undefined;
      if (e.median_income_pct && profile.householdSize) {
        limit = getIncomeThreshold(profile.householdSize, e.median_income_pct);
      } else if (e.income_recognition_max) {
        const lookupKey: Household = profile.householdSize === 1 ? "single" : "couple";
        limit =
          e.income_recognition_max[lookupKey] ??
          e.income_recognition_max.couple ??
          e.income_recognition_max.single;
      }
      if (limit === undefined) need("가구 형태에 맞는 소득 기준 확인");
      else if (profile.monthlyIncomeKrw <= limit)
        pass(
          `가구 소득이 선정기준액(${limit.toLocaleString("ko-KR")}원)보다 적으세요. (${profile.householdSize}인 가구)`,
        );
      else
        fail(
          `가구 소득이 선정기준액(${limit.toLocaleString("ko-KR")}원)을 넘어 어려워 보여요.`,
        );
    }
  }

  // 위기 상황
  if (e.requires_crisis) {
    const has =
      profile.delinquencies &&
      profile.delinquencies.length > 0 &&
      !profile.delinquencies.includes("none");
    if (has) {
      pass("체납이 있으시면 긴급 지원 대상이 될 수 있어요.");
      relevanceScore += 3;
    } else {
      if ((status as MatchStatus) !== "ineligible") status = "needs_more_info";
      totalConditions++;
    }
  }

  // 주거 형태
  if (e.requires_renter) {
    if (!profile.housingType || profile.housingType === "unknown") {
      need("주거 형태 (자가/전세/월세)");
    } else if (profile.housingType === "owned") {
      pass("자가이시면 수선유지급여(집 수리비)를 받으실 수 있어요.");
    } else {
      pass("임차(전세/월세) 가구로 주거급여 대상이에요.");
      relevanceScore += 1;
    }
  }

  // 건강 관심사 매칭
  if (
    benefit.health_tags &&
    benefit.health_tags.length > 0 &&
    profile.healthConcerns
  ) {
    const matched = benefit.health_tags.filter((t) =>
      profile.healthConcerns!.includes(t),
    );
    if (matched.length > 0) {
      pass("알려주신 건강 관심사와 관련이 있는 사업이에요.");
      relevanceScore += matched.length * 2;
    }
  }

  // 체납 태그 매칭
  if (
    benefit.delinquency_tags &&
    benefit.delinquency_tags.length > 0 &&
    profile.delinquencies
  ) {
    const matched = benefit.delinquency_tags.filter((t) =>
      profile.delinquencies!.includes(t),
    );
    if (matched.length > 0) {
      pass("알려주신 체납 상황과 관련이 있는 지원이에요.");
      relevanceScore += matched.length * 2;
    }
  }

  // 정확도 보수화 — eligible 승격은 인증된 자격이 있을 때만
  const requiresIncomeVerification = Boolean(
    e.income_recognition_max || e.median_income_pct,
  );
  const requiresPropertyVerification = requiresIncomeVerification; // 소득 검증 = 재산 환산도 필요
  const userVerified =
    profile.welfareStatus === "basic_livelihood" ||
    profile.welfareStatus === "near_poverty";

  if (!benefit.universal) {
    if (status === "likely_eligible" && missing.length === 0 && reasons.length > 0) {
      if (requiresIncomeVerification && !userVerified) {
        // 소득 검증이 필요한데 인증 안 된 일반 사용자
        // → 단순 월소득 입력만으로 "확실"이라고 못 함 (재산 환산·가구특성 미검증)
        // → likely_eligible 유지 + 추가 확인 필요 안내
        if (!missing.includes("주민센터에서 정확한 소득인정액·재산 검증 필요")) {
          missing.push("주민센터에서 정확한 소득인정액·재산 검증 필요");
        }
      } else {
        // 단순 자격(나이·국적 등)만 검증되거나 사용자가 인증서 보유자
        status = "eligible";
      }
    }
  }

  const matchPct =
    totalConditions > 0
      ? Math.round((metConditions / totalConditions) * 100)
      : 0;

  return {
    benefit,
    status,
    reasons,
    missing,
    disclaimer: DEFAULT_DISCLAIMER,
    relevanceScore,
    totalConditions,
    metConditions,
    matchPct,
  };
}

function sortByHelpfulness(matches: MatchedBenefit[]): MatchedBenefit[] {
  const rank: Record<MatchStatus, number> = {
    eligible: 0,
    likely_eligible: 1,
    needs_more_info: 2,
    ineligible: 3,
  };
  return [...matches].sort((a, b) => {
    if (a.benefit.universal && !b.benefit.universal) return 1;
    if (!a.benefit.universal && b.benefit.universal) return -1;
    const r = rank[a.status] - rank[b.status];
    if (r !== 0) return r;
    const rel = b.relevanceScore - a.relevanceScore;
    if (rel !== 0) return rel;
    const ax = a.benefit.benefit.amount_krw_max?.single ?? 0;
    const bx = b.benefit.benefit.amount_krw_max?.single ?? 0;
    return bx - ax;
  });
}

// 받는 금액·가치를 유형별로 분리해서 합산 (현실적 표시용).
// monthly_cash : 매달 통장으로 들어오는 현금
// one_time_cash : 연 1회·계절 1회 일시 지원 (12로 나누지 않고 연 합계)
// discount : 매달 감면 (요금 할인 등)
// service : 서비스 가치 (현금 X) — 합계 제외
export interface AmountBreakdown {
  monthlyCashKrw: number; // 매달 받는 현금
  monthlyDiscountKrw: number; // 매달 감면 (통신·요금)
  annualOneTimeKrw: number; // 연 1회 보조
  serviceValueKrw: number; // 참고: 서비스 가치
}

function eligibleForSum(m: MatchedBenefit): boolean {
  if (m.benefit.universal) return false;
  if (m.benefit.hidden_from_results) return false;
  return m.status === "eligible";
}

export function summarizeAmounts(matches: MatchedBenefit[]): AmountBreakdown {
  const result: AmountBreakdown = {
    monthlyCashKrw: 0,
    monthlyDiscountKrw: 0,
    annualOneTimeKrw: 0,
    serviceValueKrw: 0,
  };
  for (const m of matches) {
    if (!eligibleForSum(m)) continue;
    const amount = m.benefit.benefit.amount_krw_max?.single ?? 0;
    if (amount === 0) continue;
    switch (m.benefit.benefit.type) {
      case "monthly_cash":
        result.monthlyCashKrw += amount;
        break;
      case "discount":
        result.monthlyDiscountKrw += amount;
        break;
      case "one_time_cash":
        result.annualOneTimeKrw += amount;
        break;
      case "service":
      default:
        result.serviceValueKrw += amount;
        break;
    }
  }
  return result;
}

// 매달 가시 현금 (cash + discount). 페이지 hero 표시용.
export function monthlyTotal(matches: MatchedBenefit[]): number {
  const b = summarizeAmounts(matches);
  return b.monthlyCashKrw + b.monthlyDiscountKrw;
}

// 하위 호환용 (기존 코드 의존성).
export function totalEligibleAmount(matches: MatchedBenefit[]): number {
  return monthlyTotal(matches);
}
