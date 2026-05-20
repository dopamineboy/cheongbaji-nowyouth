// ③ 일자리 매칭 — 3단계 매칭 엔진
// 시니어 일자리 매칭 보고서 §6 (3단계 필터링 + 100점 적합도) 적용
//
// Stage 1: Hard Filter   — 80~90% 후보 제거 (연령·신체조건·마감)
// Stage 2: Soft Score    — 100점 (거리 25 + 경력 25 + 시간 20 + 임금 15 + 활동유형 15)
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

  // 신체 조건 — 사용자가 명시적으로 못 한다고 한 경우만 제외
  // (사용자가 jobPreferences를 안 적었으면 통과 — 콜드스타트 대응)
  const pref = user.jobPreferences;
  if (pref) {
    if (job.outdoor && !pref.outdoorOk) return false;
    if (job.walkingHeavy && !pref.walkingHeavyOk) return false;
    if (job.drivingRequired && !pref.drivingOk) return false;

    // 통근 시간 초과
    const km = haversineKm(user.lat, user.lng, job.lat, job.lng);
    if (commuteMinutes(km) > pref.maxCommuteMinutes) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────
// Stage 2: Soft Score (총 100점)
// ─────────────────────────────────────────────────────────

function scoreDistance(km: number): number {
  // 보고서 §6.2 기준: 도보 10분(=0.5km) 25 / 대중교통 20분(~3km) 18 / 30분(~5km) 12 / 초과 5
  const minutes = commuteMinutes(km);
  if (minutes <= 10) return 25;
  if (minutes <= 20) return 18;
  if (minutes <= 30) return 12;
  return 5;
}

function scoreCareer(job: Job, pref: UserProfile["jobPreferences"]): number {
  if (!pref || pref.pastOccupations.length === 0) return 12; // 콜드스타트 중간값

  const occLower = pref.pastOccupations.map((o) => o.toLowerCase());
  const tagLower = [...job.jobTags, job.title].map((t) => t.toLowerCase());

  const exact = occLower.some((o) => tagLower.some((t) => t.includes(o) || o.includes(t)));
  if (exact) return 25;

  // 유사도: 같은 활동유형이면 부분 점수
  if (pref.preferredJobTypes.includes(job.activityType)) return 15;
  return 5;
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
  if (distance >= 18)
    reasonsCandidates.push({ text: `${distanceKm.toFixed(1)}km · 가까워요`, weight: distance });
  if (career >= 15)
    reasonsCandidates.push({ text: "이전 경력과 잘 맞아요", weight: career });
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
