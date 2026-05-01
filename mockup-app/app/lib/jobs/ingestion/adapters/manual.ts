// 직접 등록 어댑터 — 어드민이 수기 입력한 공고
// 갱신 주기: 즉시 (refreshIntervalMin = 0)
// 데이터는 Store의 별도 manualJobs 배열에 보관

import type { Job } from "../../../types";
import { getStore } from "../../../store";
import type { JobAdapter } from "../types";

export const manualAdapter: JobAdapter = {
  source: "manual",
  refreshIntervalMin: 0,
  isAvailable() {
    return true; // 항상 사용 가능
  },
  async fetch(): Promise<Job[]> {
    // store.jobs 중 source === "수동" 인 것만 반환
    return getStore().jobs.filter((j) => j.source === "수동");
  },
};
