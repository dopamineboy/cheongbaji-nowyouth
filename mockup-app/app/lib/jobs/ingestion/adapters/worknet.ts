// 워크넷 채용정보 API 어댑터 (고용노동부 KEIS, 공공데이터포털)
// 갱신 주기: 1시간 — 시니어 일자리 매칭 보고서 §3.4
// API 키: env.WORKNET_API_KEY 에 공공데이터포털 일반 인증키 입력
// 엔드포인트: https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfoR210L.do
//   (키 발급 후 정확한 endpoint URL 변경 필요 — 데이터포털에 등록된 활용신청 문서 확인)

import type { Job, JobActivityType, JobDifficulty, TimeSlotJob } from "../../../types";
import type { JobAdapter } from "../types";

// 워크넷 채용정보 API (공공데이터포털 / work24) — 고령자 채용정보 포함 일반 채용 목록.
// 사용자 확인 endpoint (2026-05): callOpenApiSvcInfo210L01.do
// 키: env.WORKNET_API_KEY 에 일반 인증키 입력 후 어댑터 자동 활성화.
const WORKNET_ENDPOINT =
  process.env.WORKNET_API_ENDPOINT ??
  "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do";

interface WorknetJobItem {
  // 워크넷 응답 필드 — 실제 키 받은 후 키 이름 확정.
  // 아래는 공공데이터포털 일반 채용정보 표준 스펙 추정.
  wantedAuthNo?: string; // 공고번호
  wantedTitle?: string; // 제목
  company?: string; // 기업명
  region?: string; // 지역 (시·군·구)
  salTpNm?: string; // 임금
  empWantedTypeNm?: string; // 고용형태
  jobsCd?: string; // 직종코드
  ageLim?: string; // 연령 제한
  closeDt?: string; // 마감일
  regDt?: string; // 등록일
  url?: string;
}

function inferActivityType(s: WorknetJobItem): JobActivityType {
  const text = `${s.wantedTitle ?? ""} ${s.company ?? ""}`;
  if (/공익|환경정비|안전관리/.test(text)) return "공익활동형";
  if (/돌봄|교육|보육|학습|복지/.test(text)) return "사회서비스형";
  if (/택배|물류|매장|카페|공동작업장/.test(text)) return "시장형";
  return "민간";
}

function inferTimeSlot(s: WorknetJobItem): TimeSlotJob {
  const t = `${s.wantedTitle ?? ""}`;
  if (/오전|아침|등하원/.test(t)) return "morning";
  if (/오후/.test(t)) return "afternoon";
  if (/저녁|야간/.test(t)) return "evening";
  return "flexible";
}

function inferDifficulty(s: WorknetJobItem): JobDifficulty {
  const t = `${s.wantedTitle ?? ""}`;
  if (/물류|건설|이사/.test(t)) return "high";
  if (/안내|응대|학습|돌봄/.test(t)) return "low";
  return "mid";
}

function toJob(item: WorknetJobItem): Job {
  return {
    id: `j-worknet-${item.wantedAuthNo ?? Math.random().toString(36).slice(2)}`,
    source: "워크넷",
    sourceId: item.wantedAuthNo ?? "",
    title: item.wantedTitle ?? "(제목 없음)",
    org: item.company ?? "(기업 정보 없음)",
    regionCode: "", // 워크넷 응답 region을 행정코드로 매핑 필요 (S2 작업)
    regionName: item.region ?? "",
    lat: 0,
    lng: 0,
    jobTags: [],
    activityType: inferActivityType(item),
    difficulty: inferDifficulty(item),
    outdoor: false,
    walkingHeavy: false,
    drivingRequired: false,
    ageMin: 65,
    agePreferred: null,
    wageKrwPerHour: 9620,
    hoursPerWeek: 0,
    timeSlot: inferTimeSlot(item),
    schedule: item.empWantedTypeNm ?? "",
    requirements: [],
    applyUrl: item.url ?? "https://www.work.go.kr",
    contactPhone: "",
    expiresAt: item.closeDt
      ? new Date(item.closeDt).toISOString()
      : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  };
}

export const worknetAdapter: JobAdapter = {
  source: "worknet",
  refreshIntervalMin: 60,
  isAvailable() {
    return Boolean(process.env.WORKNET_API_KEY);
  },
  async fetch() {
    if (!process.env.WORKNET_API_KEY) {
      return [];
    }
    const url = new URL(WORKNET_ENDPOINT);
    url.searchParams.set("authKey", process.env.WORKNET_API_KEY!);
    url.searchParams.set("returnType", "JSON");
    url.searchParams.set("callTp", "L"); // 목록 조회
    url.searchParams.set("startPage", "1");
    url.searchParams.set("display", "100");
    // 고령자 채용정보 — 60세 이상 우대 (필요 시 mClcd/clcd 등 분류코드 추가)
    url.searchParams.set("minAge", "60");

    const res = await fetch(url, {
      next: { revalidate: 60 * 60 }, // 1시간 캐시
    });
    if (!res.ok) {
      throw new Error(`worknet ${res.status}: ${await res.text()}`);
    }

    const text = await res.text();

    // XML 응답 fallback: 일부 work24 endpoint는 returnType 무시하고 XML만 반환.
    // 핵심 필드만 정규식으로 추출 (간이 파서, 한국어 토큰 안전).
    if (text.trim().startsWith("<")) {
      const items: WorknetJobItem[] = [];
      const blockRe = /<wanted>([\s\S]*?)<\/wanted>/g;
      const tagRe = (tag: string) =>
        new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`);
      let m: RegExpExecArray | null;
      while ((m = blockRe.exec(text)) !== null) {
        const block = m[1];
        const get = (tag: string) =>
          (block.match(tagRe(tag))?.[1] ?? "").trim();
        items.push({
          wantedAuthNo: get("wantedAuthNo"),
          wantedTitle: get("wantedTitle"),
          company: get("company"),
          region: get("region"),
          salTpNm: get("salTpNm"),
          empWantedTypeNm: get("empWantedTypeNm"),
          jobsCd: get("jobsCd"),
          ageLim: get("ageLim"),
          closeDt: get("closeDt"),
          regDt: get("regDt"),
          url: get("infoSvcUrl") || get("url"),
        });
      }
      return items.map(toJob);
    }

    // JSON 응답
    const json = (await JSON.parse(text)) as
      | { items?: WorknetJobItem[]; wantedRoot?: { wanted?: WorknetJobItem[] } }
      | WorknetJobItem[];
    const items: WorknetJobItem[] = Array.isArray(json)
      ? json
      : json.items ?? json.wantedRoot?.wanted ?? [];
    return items.map(toJob);
  },
};
