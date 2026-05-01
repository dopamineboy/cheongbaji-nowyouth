// 지자체 일자리 크롤링 어댑터
// 갱신 주기: 1일 — 시니어 일자리 매칭 보고서 §3.4
// 주의: 사이트별 robots.txt + 이용약관 확인 필수.
//   본 구현은 "어떤 지자체를 어디서 가져올지"만 인터페이스로 정의.
//   실제 크롤링 로직은 키·법무 검토 후 별도 워커(node-cron + cheerio + playwright)에서 실행.

import type { Job } from "../../../types";
import type { JobAdapter } from "../types";

interface MunicipalSourceConfig {
  /** 지자체 이름 (예: "종로구청") */
  name: string;
  /** 공고 목록 URL (robots.txt 확인 후) */
  url: string;
  /** robots.txt 검토 완료 여부 */
  legalCleared: boolean;
}

const SOURCES: MunicipalSourceConfig[] = [
  // 검토 완료된 지자체만 추가 (현재 0개 — 별도 법무 검토 필요)
];

export const municipalAdapter: JobAdapter = {
  source: "municipal",
  refreshIntervalMin: 60 * 24,
  isAvailable() {
    return SOURCES.filter((s) => s.legalCleared).length > 0;
  },
  async fetch(): Promise<Job[]> {
    // 법무 검토 통과한 소스만 순차 크롤링.
    // S1 단계는 비활성화 — 빈 배열 반환.
    return [];
  },
};
