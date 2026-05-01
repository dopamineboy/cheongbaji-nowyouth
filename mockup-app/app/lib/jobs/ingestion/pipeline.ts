// 일자리 통합 수집 파이프라인
// 4개 어댑터의 결과를 받아 → 중복제거 → 마감 체크 → 캐시 업데이트
// 시니어 일자리 매칭 보고서 §3.4 갱신 주기 표 구현.

import type { Job } from "../../types";
import { kordiAdapter } from "./adapters/kordi";
import { manualAdapter } from "./adapters/manual";
import { municipalAdapter } from "./adapters/municipal";
import { worknetAdapter } from "./adapters/worknet";
import type { IngestionResult, JobAdapter } from "./types";

const ADAPTERS: JobAdapter[] = [
  worknetAdapter,
  kordiAdapter,
  municipalAdapter,
  manualAdapter,
];

// 마지막 동기화 시각 — globalThis 캐시
declare global {
  // eslint-disable-next-line no-var
  var __cheongbajiJobsLastSync:
    | Map<string, number>
    | undefined;
}
function lastSyncMap(): Map<string, number> {
  if (!globalThis.__cheongbajiJobsLastSync) {
    globalThis.__cheongbajiJobsLastSync = new Map();
  }
  return globalThis.__cheongbajiJobsLastSync;
}

/** 만료된 공고 필터링 — 6시간마다 자동 정리 */
export function filterExpired(jobs: Job[]): Job[] {
  const now = Date.now();
  return jobs.filter((j) => new Date(j.expiresAt).getTime() > now);
}

/** 중복제거 — 제목 + 위치 + 활동유형 비교 (보고서 §7.3) */
export function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const j of jobs) {
    const key = `${j.title.trim()}|${j.regionName}|${j.activityType}`;
    if (!seen.has(key)) seen.set(key, j);
    else {
      // 더 최근 마감 우선
      const existing = seen.get(key)!;
      if (new Date(j.expiresAt) > new Date(existing.expiresAt)) seen.set(key, j);
    }
  }
  return Array.from(seen.values());
}

export interface PipelineRunOptions {
  /** 강제 새로고침 — refresh interval 무시 */
  force?: boolean;
  /** 특정 소스만 실행 */
  only?: JobAdapter["source"][];
}

export interface PipelineSummary {
  startedAt: string;
  endedAt: string;
  totalDurationMs: number;
  results: IngestionResult[];
  finalCount: number;
}

export async function runIngestion(
  options: PipelineRunOptions = {},
): Promise<PipelineSummary> {
  const start = Date.now();
  const startedAt = new Date(start).toISOString();
  const results: IngestionResult[] = [];
  const all: Job[] = [];

  for (const adapter of ADAPTERS) {
    if (options.only && !options.only.includes(adapter.source)) continue;

    if (!adapter.isAvailable()) {
      results.push({
        source: adapter.source,
        status: "skipped",
        fetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        expired: 0,
        durationMs: 0,
        errorMessage: "어댑터 사용 불가 (API 키 또는 설정 없음)",
      });
      continue;
    }

    // 갱신 주기 체크
    if (!options.force && adapter.refreshIntervalMin > 0) {
      const last = lastSyncMap().get(adapter.source) ?? 0;
      const intervalMs = adapter.refreshIntervalMin * 60 * 1000;
      if (Date.now() - last < intervalMs) {
        results.push({
          source: adapter.source,
          status: "skipped",
          fetched: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          expired: 0,
          durationMs: 0,
          errorMessage: "갱신 주기 미도래",
        });
        continue;
      }
    }

    const t0 = Date.now();
    try {
      const fetched = await adapter.fetch();
      const cleaned = filterExpired(fetched);
      const expired = fetched.length - cleaned.length;
      all.push(...cleaned);
      lastSyncMap().set(adapter.source, Date.now());

      results.push({
        source: adapter.source,
        status: "ok",
        fetched: fetched.length,
        inserted: cleaned.length,
        updated: 0,
        skipped: 0,
        expired,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      results.push({
        source: adapter.source,
        status: "error",
        fetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        expired: 0,
        durationMs: Date.now() - t0,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const deduped = dedupeJobs(all);

  return {
    startedAt,
    endedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - start,
    results,
    finalCount: deduped.length,
  };
}

export function adapterStatus(): {
  source: JobAdapter["source"];
  available: boolean;
  refreshIntervalMin: number;
  lastSyncAt: string | null;
}[] {
  return ADAPTERS.map((a) => {
    const last = lastSyncMap().get(a.source);
    return {
      source: a.source,
      available: a.isAvailable(),
      refreshIntervalMin: a.refreshIntervalMin,
      lastSyncAt: last ? new Date(last).toISOString() : null,
    };
  });
}
