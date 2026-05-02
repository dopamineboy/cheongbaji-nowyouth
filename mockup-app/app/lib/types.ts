// 청바지(NowYouth) 도메인 타입 정의
// 4대 통합서비스 구현계획서 §1, §3.3 기반

// ─────────────────────────────────────────────────────────
// 사용자 / 프로필
// ─────────────────────────────────────────────────────────

export type HouseholdType = "single" | "couple" | "with_family";

export interface UserProfile {
  id: string;
  name: string;
  birthYear: number; // 예: 1956
  dongCode: string; // 행정동 코드 10자리
  dongName: string; // 표시용 (예: "종로구 종로1·2·3·4가동")
  household: HouseholdType;
  householdSize: number; // 가구원 수 (복지 매칭에 필수)
  // 소득 — 월 단위, 원 (도우다 matcher 호환)
  monthlyIncomeKrw: number | null;
  pensionStatus: "receiving" | "applied" | "none" | null;
  interests: string[]; // 자유 태그
  // 좌표 (지오펜싱·일자리 거리 매칭)
  lat: number;
  lng: number;
  // 복지 매칭 보강 필드 (도우다 matcher 호환)
  region: string; // 시·도 (예: "서울특별시")
  district: string; // 시·군·구 (예: "종로구")
  welfareStatus: "basic_livelihood" | "near_poverty" | "none" | "unknown";
  hasDisability: boolean;
  healthConcerns: ("teeth" | "eyes" | "daily_life" | "none")[];
  housingType: "owned" | "jeonse" | "monthly_rent" | "public_rental" | "unknown";
  delinquencies: ("maintenance" | "health_insurance" | "utility" | "none")[];
  citizenship: string;
  // 이미 신청·수령 중인 복지 ID (welfare YAML id 기준)
  receivedBenefitIds: string[];
  // 일자리 매칭용 선호 (Skip 가능 — 시니어 일자리 매칭 보고서 §5.1 STEP 4)
  jobPreferences?: JobPreferences;
}

export interface JobPreferences {
  preferredJobTypes: JobActivityType[]; // 공익/사회서비스/시장 중 선호
  pastOccupations: string[]; // 이전 직종 자유 태그
  maxCommuteMinutes: number; // 최대 통근 시간 (도보+대중교통 합산)
  preferredTimeSlots: TimeSlot[]; // 선호 시간대
  desiredHourlyWageKrw: number | null; // 희망 시급 (null = 무관)
  outdoorOk: boolean; // 야외 활동 가능
  walkingHeavyOk: boolean; // 도보 많은 일 가능
  drivingOk: boolean; // 운전 가능
}

export type TimeSlot = "morning" | "afternoon" | "evening";

// ─────────────────────────────────────────────────────────
// ① 복지 알리미 — 도우다 matcher 스키마 사용 (lib/welfare/matcher.ts)
// ─────────────────────────────────────────────────────────
// `Benefit` / `MatchedBenefit` 타입은 lib/welfare/matcher.ts에서 export.
// content/benefits/*.yml YAML로 데이터 관리.

// ─────────────────────────────────────────────────────────
// ② 활동 리워드 (포인트 원장)
// ─────────────────────────────────────────────────────────

export type LedgerType =
  | "WALK"
  | "GAME"
  | "STAMP"
  | "CULTURE"
  | "LEARN"
  | "EVENT"
  | "WELFARE"
  | "JOB"
  | "POOMASI"
  | "REDEEM"
  | "ADMIN_ADJUST";

export type LedgerSource = "USER_ACTION" | "SYSTEM_AWARD" | "ADMIN_CORRECTION";

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerType;
  amount: number; // 양수 = 적립, 음수 = 차감
  metadata: Record<string, unknown>;
  source: LedgerSource;
  createdAt: string; // ISO
  immutable: true;
}

// ─────────────────────────────────────────────────────────
// ③ 일자리 매칭
// ─────────────────────────────────────────────────────────

// 활동 유형 (시니어 일자리 매칭 보고서 §4.2)
export type JobActivityType =
  | "공익활동형" // 환경정비·안전관리 등 공공업무
  | "사회서비스형" // 돌봄·교육보조 등 경험 활용
  | "시장형" // 카페·택배·공동작업장 등 수익형
  | "민간"; // 민간기업 구인

export type JobDifficulty = "low" | "mid" | "high";
export type TimeSlotJob = "morning" | "afternoon" | "evening" | "flexible";

export interface Job {
  id: string;
  source: "워크넷" | "노인인력개발원" | "지자체수행기관" | "파트너플랫폼" | "수동";
  sourceId: string;
  title: string;
  org: string; // 수행기관명
  regionCode: string;
  regionName: string;
  lat: number;
  lng: number;
  jobTags: string[]; // 예: ["경비", "시설관리"]
  // 시니어 일자리 매칭 보고서 §4.2 태깅 구조
  activityType: JobActivityType;
  difficulty: JobDifficulty;
  // 신체 조건 요구
  outdoor: boolean;
  walkingHeavy: boolean;
  drivingRequired: boolean;
  ageMin: number;
  agePreferred: number | null;
  // 시간·임금
  wageKrwPerHour: number;
  hoursPerWeek: number;
  timeSlot: TimeSlotJob;
  schedule: string; // 자유 텍스트 (예: "주 3회 오전")
  // 신청
  requirements: string[];
  applyUrl: string;
  contactPhone: string;
  expiresAt: string; // ISO
}

// ─────────────────────────────────────────────────────────
// ④ 품앗이 커뮤니티
// ─────────────────────────────────────────────────────────

export type PoomasiCategory =
  | "life_help" // 생활 도움
  | "house_chore" // 가사
  | "digital" // 디지털
  | "talk" // 대화 상대
  | "skill_share" // 재능 나눔
  | "etc";

export type PoomasiStatus = "open" | "matched" | "completed" | "cancelled";

export interface PoomasiPost {
  id: string;
  authorId: string;
  authorName: string; // 마스킹 전 실명 (매칭 후 노출)
  authorMaskedName: string; // 매칭 전 노출용 (예: "김○○")
  dongCode: string;
  dongName: string;
  category: PoomasiCategory;
  title: string;
  body: string;
  preferredTime: string; // 자유 텍스트
  status: PoomasiStatus;
  helperId: string | null;
  reportCount: number;
  createdAt: string;
  // 시연용 시드 데이터 표시 (UI에 "예시" 라벨)
  isSeed?: boolean;
}

// ─────────────────────────────────────────────────────────
// API 공통
// ─────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
