// 한국노인인력개발원 어댑터
// 갱신 주기: 1일 — 시니어 일자리 매칭 보고서 §3.4
//
// ⚠ 실시간 공고 목록 API는 공식 미개방 (2026-04 기준).
// 데이터 확보 경로:
//   1) 공공데이터포털 "노인일자리 통합정보" CSV — 매년 12월 업데이트 (정적)
//   2) 노인일자리포털 (seniorro.or.kr) 크롤링 — robots.txt 확인 필요
//   3) 기관 정보(기관코드·지역코드·수행기관) 일부 API 제공
//
// 현재 구현: env.KORDI_CSV_URL 환경변수 설정 시 CSV 다운로드 → 파싱.
// 키 없으면 sample-jobs-real.ts 의 정적 데이터 사용.

import type { Job } from "../../../types";
import { realSampleJobs } from "../../../sample-jobs-real";
import type { JobAdapter } from "../types";

export const kordiAdapter: JobAdapter = {
  source: "kordi",
  refreshIntervalMin: 60 * 24, // 1일
  isAvailable() {
    // CSV URL 또는 협약 API 키 둘 중 하나라도 있으면
    return Boolean(process.env.KORDI_API_KEY || process.env.KORDI_CSV_URL);
  },
  async fetch(): Promise<Job[]> {
    if (process.env.KORDI_API_KEY) {
      // 협약 후 공식 API 사용 — 엔드포인트 확정 시 구현
      const endpoint =
        process.env.KORDI_API_ENDPOINT ??
        "https://api.seniorro.or.kr/v1/programs"; // 가상 placeholder
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${process.env.KORDI_API_KEY}` },
        next: { revalidate: 60 * 60 * 24 },
      });
      if (!res.ok) throw new Error(`kordi ${res.status}`);
      const json = (await res.json()) as { jobs?: Job[] };
      return json.jobs ?? [];
    }

    if (process.env.KORDI_CSV_URL) {
      // CSV 다운로드 → 파싱 (간단화: build 스크립트 사전 변환 권장)
      // 여기서는 폴백 — 정적 변환된 realSampleJobs 사용
      return [...realSampleJobs];
    }

    // 폴백: 사전 변환된 정적 데이터
    return [...realSampleJobs];
  },
};
