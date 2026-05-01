// 일자리 수집 파이프라인 — 공통 어댑터 인터페이스

import type { Job } from "../../types";

export type IngestionSource =
  | "worknet" // 워크넷 채용정보 API (1시간)
  | "kordi" // 한국노인인력개발원 (1일, 협약/CSV)
  | "municipal" // 지자체 크롤링 (1일)
  | "manual"; // 직접 등록 (즉시)

export type IngestionStatus = "ok" | "skipped" | "error";

export interface IngestionResult {
  source: IngestionSource;
  status: IngestionStatus;
  fetched: number; // 받은 건수
  inserted: number; // 새로 삽입
  updated: number; // 갱신
  skipped: number; // 중복으로 무시
  expired: number; // 마감으로 폐기
  errorMessage?: string;
  durationMs: number;
}

export interface JobAdapter {
  source: IngestionSource;
  /** 갱신 주기 (분) — 워크넷 60, 노인인력 1440, 지자체 1440, 직접등록 즉시(0) */
  refreshIntervalMin: number;
  /** 데이터를 받아서 표준 Job[] 으로 반환. API 키 없으면 빈 배열 또는 throw. */
  fetch(): Promise<Job[]>;
  /** 환경에서 사용 가능한지 (API 키 등 체크) */
  isAvailable(): boolean;
}
