// ③ 일자리 매칭 — 3단계 매칭 엔진
// 시니어 일자리 매칭 보고서 §6 (3단계 필터링 + 100점 적합도) 적용
//
// Stage 1: Hard Filter   — 80~90% 후보 제거 (연령·신체조건·마감)
// Stage 2: Soft Score    — 100점 (경력 30 + 거리 20 + 시간 20 + 임금 15 + 활동유형 15)
//                          ↑ 사용자 의도("경력을 더 확실하게")로 경력 비중 강화
// Stage 3: Top-5 Diversity — 단순 점수순이 아닌 의도된 믹스
//   1~2위 최고점수 / 3위 경력활용 / 4위 임금높은 / 5위 새로운 유형 (탐색)

import { calculateAge } from "../age";
import type { Job, UserProfile } from "../types";

export interface ScoredJob extends Job {
  score: number;
  scoreBreakdown: {
    distance: number;
    career: number;
    time: number;
    wage: number;
    activity: number;
  };
  distanceKm: number;
  matchReason: string; // 한 줄 설명 ("이유 설명형")
  pickedAs?: "top" | "career" | "wage" | "explore";
}

// Haversine 거리 (km)
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 거리 → 분 변환 (대중교통 평균 가정: 도보 20분 = 1km, 대중교통 5분 = 1km)
function commuteMinutes(km: number): number {
  if (km < 1) return Math.round(km * 20); // 도보
  if (km < 5) return Math.round(km * 8); // 가까운 대중교통
  return Math.round(km * 6 + 10); // 환승 포함
}

// ─────────────────────────────────────────────────────────
// Stage 1: Hard Filter
// ─────────────────────────────────────────────────────────

/**
 * 사용자 시·도와 일자리 시·도가 일치하는지 + 광역 경계 통근권(60분 이내) 예외.
 * "지방 사용자에게 서울 일자리 노출" 같은 부정확 매칭을 막는 강한 필터.
 *
 * - 같은 시·도면 통과
 * - 다른 시·도면 통근 시간 60분 이내일 때만 통과 (서울↔경기 같은 광역 경계)
 * - 사용자 region 미입력자는 region 무시하고 거리만으로 판단
 */
function regionMatches(
  userRegion: string | undefined,
  jobRegionName: string,
  commuteMin: number,
): boolean {
  if (!userRegion) return true;
  // jobRegionName 예: "서울특별시 종로구", "경기도 수원시" — 앞 토큰이 시·도
  const jobRegion = jobRegionName.split(/\s+/)[0];
  if (!jobRegion) return true;
  if (userRegion === jobRegion) return true;
  // 다른 시·도 — 60분 이내만 통과 (광역 경계 통근)
  return commuteMin <= 60;
}

export function passHardFilter(
  user: UserProfile,
  job: Job,
  now: Date = new Date(),
): boolean {
  // 마감 지난 공고 제거
  if (new Date(job.expiresAt).getTime() < now.getTime()) return false;

  // 연령 제한 — 정밀 만 나이 계산 (생일 지났는지 반영)
  const age = calculateAge(user.birthYear, user.birthMonth, now);
  if (age < job.ageMin) return false;

  // 거리·통근 시간 (region 매칭 + 통근 필터에 둘 다 사용)
  const km = haversineKm(user.lat, user.lng, job.lat, job.lng);
  const commuteMin = commuteMinutes(km);

  // 시·도 일치 (사용자 region 기준) — 다른 시·도면 60분 이내일 때만 통과
  if (!regionMatches(user.region, job.regionName, commuteMin)) return false;

  // 신체 조건 — 사용자가 명시적으로 못 한다고 한 경우만 제외
  // (사용자가 jobPreferences를 안 적었으면 통과 — 콜드스타트 대응)
  const pref = user.jobPreferences;
  if (pref) {
    if (job.outdoor && !pref.outdoorOk) return false;
    if (job.walkingHeavy && !pref.walkingHeavyOk) return false;
    if (job.drivingRequired && !pref.drivingOk) return false;
    // 통근 시간 초과
    if (commuteMin > pref.maxCommuteMinutes) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────
// Stage 2: Soft Score (총 100점)
// ─────────────────────────────────────────────────────────

function scoreDistance(km: number): number {
  // 만점 20점 (사용자 의도로 거리 비중 ↓, 경력 ↑로 재배분)
  // 도보 10분(=0.5km) 20 / 대중교통 20분(~3km) 14 / 30분(~5km) 9 / 초과 4
  const minutes = commuteMinutes(km);
  if (minutes <= 10) return 20;
  if (minutes <= 20) return 14;
  if (minutes <= 30) return 9;
  return 4;
}

/**
 * 사용자 선택형 경력(15개 카테고리) → 일자리 jobTags·title에 흩어진 실제 직종명을 잇는 시노님 맵.
 * 예: 사용자가 "교육"을 골랐고 일자리 title이 "방과후교실 도우미사업"이면 → "방과후"가 시노님에 있어 매칭 성공.
 *
 * 카테고리 키는 onboarding-flow.tsx / field-editor.tsx의 OCCUPATIONS와 1:1 일치해야 함.
 */
const OCCUPATION_SYNONYMS: Record<string, string[]> = {
  "교육": ["교사", "강사", "교사보조", "방과후", "학원", "튜터", "학교", "도서관", "교실"],
  "사무·행정": ["사무", "행정", "회사원", "공무원", "서류", "민원", "안내데스크"],
  "주방·식당": ["조리", "서빙", "주방", "식당", "급식", "조리사", "도시락"],
  "보육·돌봄": ["보육", "돌봄", "어린이집", "요양", "간병", "도우미", "돌보미", "아동"],
  "운수·교통": ["운전", "택시", "버스", "기사", "배달", "교통", "교통안전", "택배"],
  "환경·청소": ["환경", "청소", "미화", "정비", "공원", "재활용", "EM"],
  "공방·수공예": ["공방", "수공예", "제조", "기능", "전통식품"],
  "응대·안내": ["응대", "안내", "매장", "고객", "리셉션", "해설"],
  "건설·기능직": ["건설", "목수", "전기", "설비", "도장", "용접", "기능"],
  "판매·영업": ["판매", "영업", "도소매", "외판", "매장", "카페", "찻집"],
  "의료·간호": ["간호", "간호조무", "병원", "의료", "복지관"],
  "농업·임업": ["농업", "임업", "농사", "산림", "원예", "정원"],
  "관리·경비": ["경비", "관리", "수위", "관리사무", "주차", "지킴이", "모니터링"],
  "IT·전산": ["IT", "전산", "PC", "컴퓨터", "데이터", "디지털", "스마트"],
  "예술·문화": ["문화", "예술", "해설", "관광", "공연", "도슨트", "문화유산"],
};

function expandOccupations(occupations: string[]): string[] {
  const expanded = new Set<string>();
  for (const occ of occupations) {
    expanded.add(occ.toLowerCase());
    const syns = OCCUPATION_SYNONYMS[occ] ?? [];
    syns.forEach((s) => expanded.add(s.toLowerCase()));
  }
  return Array.from(expanded);
}

function scoreCareer(job: Job, pref: UserProfile["jobPreferences"]): number {
  // 만점 30점 (경력 비중 강화: 25 → 30)
  if (!pref || pref.pastOccupations.length === 0) return 14; // 콜드스타트 중간값

  const occLower = expandOccupations(pref.pastOccupations);
  const tagLower = [...job.jobTags, job.title].map((t) => t.toLowerCase());

  const exact = occLower.some((o) => tagLower.some((t) => t.includes(o) || o.includes(t)));
  if (exact) return 30;

  // 유사도: 같은 활동유형이면 부분 점수
  if (pref.preferredJobTypes.includes(job.activityType)) return 15;
  return 6;
}

function scoreTime(job: Job, pref: UserProfile["jobPreferences"]): number {
  if (!pref) return 10; // 콜드스타트 중간값
  if (job.timeSlot === "flexible") return 20;
  if (pref.preferredTimeSlots.includes(job.timeSlot)) return 20;
  // 부분 일치 — 인접 슬롯
  const adjacency: Record<string, string[]> = {
    morning: ["afternoon"],
    afternoon: ["morning", "evening"],
    evening: ["afternoon"],
  };
  const adj = adjacency[job.timeSlot] ?? [];
  if (adj.some((s) => pref.preferredTimeSlots.includes(s as never))) return 10;
  return 0;
}

function scoreWage(job: Job, pref: UserProfile["jobPreferences"]): number {
  if (!pref || pref.desiredHourlyWageKrw === null) return 10; // 콜드스타트 중간값
  const desired = pref.desiredHourlyWageKrw;
  if (job.wageKrwPerHour >= desired) return 15;
  const gapPct = (desired - job.wageKrwPerHour) / desired;
  if (gapPct < 0.1) return 10;
  if (gapPct < 0.3) return 5;
  return 0;
}

function scoreActivity(job: Job, pref: UserProfile["jobPreferences"]): number {
  if (!pref || pref.preferredJobTypes.length === 0) return 8; // 콜드스타트 중간값
  if (pref.preferredJobTypes.includes(job.activityType)) return 15;
  // 공익↔사회서비스 부분 일치
  const partial: Record<string, string[]> = {
    공익활동형: ["사회서비스형"],
    사회서비스형: ["공익활동형"],
    시장형: ["민간"],
    민간: ["시장형"],
  };
  const adj = partial[job.activityType] ?? [];
  if (adj.some((a) => pref.preferredJobTypes.includes(a as never))) return 8;
  return 0;
}

export function scoreJob(user: UserProfile, job: Job): ScoredJob {
  const distanceKm = haversineKm(user.lat, user.lng, job.lat, job.lng);
  const distance = scoreDistance(distanceKm);
  const career = scoreCareer(job, user.jobPreferences);
  const time = scoreTime(job, user.jobPreferences);
  const wage = scoreWage(job, user.jobPreferences);
  const activity = scoreActivity(job, user.jobPreferences);
  const score = distance + career + time + wage + activity;

  // "이유 설명형" 한 줄 — 가장 강한 항목 1개를 picks
  const reasonsCandidates: { text: string; weight: number }[] = [];
  if (distance >= 14)
    reasonsCandidates.push({ text: `${distanceKm.toFixed(1)}km · 가까워요`, weight: distance });
  if (career >= 30)
    reasonsCandidates.push({ text: "이전 경력과 정확히 맞아요", weight: career });
  else if (career >= 15)
    reasonsCandidates.push({ text: "관심 활동과 잘 맞아요", weight: career });
  if (time >= 20)
    reasonsCandidates.push({ text: "원하시는 시간대예요", weight: time });
  if (wage === 15)
    reasonsCandidates.push({ text: "희망 시급 이상", weight: wage });
  if (activity === 15)
    reasonsCandidates.push({ text: `${job.activityType} 선호`, weight: activity });

  const matchReason =
    reasonsCandidates.sort((a, b) => b.weight - a.weight)[0]?.text ??
    `우리 동네 가까운 ${job.activityType}`;

  return {
    ...job,
    distanceKm,
    score,
    scoreBreakdown: { distance, career, time, wage, activity },
    matchReason,
  };
}

// ─────────────────────────────────────────────────────────
// Stage 3: Top-N Diversity (Top-5 의도된 믹스)
// ─────────────────────────────────────────────────────────

export function diversifiedTop5(scored: ScoredJob[]): ScoredJob[] {
  if (scored.length === 0) return [];
  const byScore = [...scored].sort((a, b) => b.score - a.score);
  const result: ScoredJob[] = [];
  const usedIds = new Set<string>();

  // 1~2위: 최고 점수 (안정)
  for (const j of byScore.slice(0, 2)) {
    result.push({ ...j, pickedAs: "top" });
    usedIds.add(j.id);
  }

  // 3위: 경력 활용 — 경력 점수 가장 높은 미사용 후보
  const careerPick = byScore.find(
    (j) => !usedIds.has(j.id) && j.scoreBreakdown.career >= 15,
  );
  if (careerPick) {
    result.push({ ...careerPick, pickedAs: "career" });
    usedIds.add(careerPick.id);
  }

  // 4위: 임금 높은 — 시급 가장 높은 미사용
  const wagePick = [...byScore]
    .filter((j) => !usedIds.has(j.id))
    .sort((a, b) => b.wageKrwPerHour - a.wageKrwPerHour)[0];
  if (wagePick) {
    result.push({ ...wagePick, pickedAs: "wage" });
    usedIds.add(wagePick.id);
  }

  // 5위: 탐색 — 결과 내 등장하지 않은 활동유형
  const usedActivityTypes = new Set(result.map((r) => r.activityType));
  const explorePick = byScore.find(
    (j) => !usedIds.has(j.id) && !usedActivityTypes.has(j.activityType),
  );
  if (explorePick) {
    result.push({ ...explorePick, pickedAs: "explore" });
    usedIds.add(explorePick.id);
  }

  // 5칸 못 채운 경우 점수순으로 채움
  if (result.length < 5) {
    for (const j of byScore) {
      if (result.length >= 5) break;
      if (!usedIds.has(j.id)) {
        result.push({ ...j, pickedAs: "top" });
        usedIds.add(j.id);
      }
    }
  }

  return result;
}

// 통합 함수: Hard Filter → Score → Top-5 Diversity
// 0건이면 통근 시간을 자동 완화해서 재시도 (30 → 60 → 120분)
export interface MatchResult {
  jobs: ScoredJob[];
  appliedMaxCommuteMinutes: number;
  relaxed: boolean; // 통근 시간 자동 확장 여부
  totalCandidates: number;
}

export function matchJobsForUser(
  user: UserProfile,
  jobs: Job[],
  now: Date = new Date(),
): ScoredJob[] {
  return matchJobsWithDetails(user, jobs, now).jobs;
}

export function matchJobsWithDetails(
  user: UserProfile,
  jobs: Job[],
  now: Date = new Date(),
): MatchResult {
  const baseMax = user.jobPreferences?.maxCommuteMinutes ?? 30;
  const tries = [baseMax, 60, 120, 9999]; // 999는 사실상 무제한
  let lastResult: ScoredJob[] = [];
  let appliedMax = baseMax;
  let relaxed = false;

  for (const maxMin of tries) {
    appliedMax = maxMin;
    relaxed = maxMin !== baseMax;
    // 사용자 프로필 임시 클론 (원본 변경 X)
    const profile: UserProfile = {
      ...user,
      jobPreferences: user.jobPreferences
        ? { ...user.jobPreferences, maxCommuteMinutes: maxMin }
        : undefined,
    };
    const passed = jobs.filter((j) => passHardFilter(profile, j, now));
    const scored = passed.map((j) => scoreJob(profile, j));
    lastResult = diversifiedTop5(scored);
    if (lastResult.length > 0) {
      return {
        jobs: lastResult,
        appliedMaxCommuteMinutes: maxMin,
        relaxed,
        totalCandidates: passed.length,
      };
    }
  }

  return {
    jobs: lastResult,
    appliedMaxCommuteMinutes: appliedMax,
    relaxed,
    totalCandidates: 0,
  };
}
