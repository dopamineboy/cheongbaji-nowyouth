// 일자리 → 연계 교육 매칭
import type { Job } from "../types";
import { TRAINING_COURSES, type TrainingCourse } from "./courses";

/** 한 일자리에 매칭되는 교육 — Top N */
export function matchTrainingsForJob(
  job: Job,
  limit = 3,
): TrainingCourse[] {
  const haystack = [
    ...job.jobTags,
    job.activityType,
    ...job.requirements,
    job.title,
  ]
    .join(" ")
    .toLowerCase();

  const scored = TRAINING_COURSES.map((c) => {
    let score = 0;
    for (const tag of c.targetTags) {
      if (haystack.includes(tag.toLowerCase())) score += 2;
    }
    return { course: c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.course);
}

/** 사용자 관심 분야 → 추천 교육 (전체 목록 페이지용) */
export function recommendedTrainings(
  preferredJobTypes: string[] = [],
  pastOccupations: string[] = [],
  limit = 6,
): TrainingCourse[] {
  if (preferredJobTypes.length === 0 && pastOccupations.length === 0) {
    return TRAINING_COURSES.slice(0, limit);
  }
  const haystack = [...preferredJobTypes, ...pastOccupations]
    .join(" ")
    .toLowerCase();

  const scored = TRAINING_COURSES.map((c) => {
    let score = 0;
    for (const tag of c.targetTags) {
      if (haystack.includes(tag.toLowerCase())) score += 1;
    }
    return { course: c, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.course);
}
