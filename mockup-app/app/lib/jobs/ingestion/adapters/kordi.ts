// 한국노인인력개발원 100세누리 구인정보 API 어댑터
// 공식 활용가이드 v1.1 (서비스 ID B552474 / SenuriService) 기반.
// 갱신 주기: 일 1회.
//
// 환경 변수:
//   KORDI_API_KEY        — 공공데이터포털에서 발급받은 인증키 (URL-Encode 또는 raw hex)
//   KORDI_API_ENDPOINT   — 선택. 기본 http://apis.data.go.kr/B552474/SenuriService
//
// 응답: XML (가이드 표준). 본 어댑터에서 정규식으로 파싱.

import type { Job, JobActivityType, JobDifficulty, TimeSlotJob } from "../../../types";
import { realSampleJobs } from "../../../sample-jobs-real";
import { geocodeKeyword, isKakaoAvailable } from "../../../geo/kakao";
import type { JobAdapter } from "../types";

const KORDI_BASE =
  process.env.KORDI_API_ENDPOINT ??
  "http://apis.data.go.kr/B552474/SenuriService";

// 고용형태 코드 → 활동유형 매핑 (가이드 §4.1 emplymShp)
const EMPLYMSHP_TO_ACTIVITY: Record<string, JobActivityType> = {
  CM0101: "민간",      // 정규직
  CM0102: "민간",      // 계약직
  CM0103: "시장형",    // 시간제일자리
  CM0104: "시장형",    // 일당직
  CM0105: "사회서비스형", // 기타
};

// 코드 → 한국어 이름 (실제 API가 emplymShpNm 자리에 코드를 반환하는 경우 폴백)
const EMPLYMSHP_NAME: Record<string, string> = {
  CM0101: "정규직",
  CM0102: "계약직",
  CM0103: "시간제일자리",
  CM0104: "일당직",
  CM0105: "기타",
};

interface SenuriJobItem {
  jobId: string;
  recrtTitle: string;
  oranNm: string; // 기업명
  workPlcNm: string;
  workPlc: string;
  emplymShp: string;
  emplymShpNm: string;
  jobcls: string;
  jobclsNm: string;
  frDd: string; // 시작접수일 yyyymmdd
  toDd: string; // 종료접수일 yyyymmdd
  deadline: string; // 마감 여부
  acptMthd: string; // 접수방법
  stmId: string;
  stmNm: string;
}

function parseDate(yyyymmdd: string): Date {
  if (!/^\d{8}$/.test(yyyymmdd)) return new Date();
  return new Date(
    `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T23:59:59Z`,
  );
}

function inferDifficulty(item: SenuriJobItem): JobDifficulty {
  const t = `${item.recrtTitle} ${item.jobclsNm}`;
  if (/물류|건설|이사|생산|제조/.test(t)) return "high";
  if (/안내|응대|돌봄|학습|선생님/.test(t)) return "low";
  return "mid";
}

function inferTimeSlot(item: SenuriJobItem): TimeSlotJob {
  const t = item.recrtTitle;
  if (/오전|아침/.test(t)) return "morning";
  if (/오후/.test(t)) return "afternoon";
  if (/저녁|야간|심야/.test(t)) return "evening";
  return "flexible";
}

// 서울 자치구 → 좌표 (Geocoding 안 거치고 가구 중심값으로 근사)
const SEOUL_GU_LATLNG: Record<string, [number, number]> = {
  종로구: [37.5734, 126.9789],
  중구: [37.5641, 126.9979],
  용산구: [37.5326, 126.9909],
  성동구: [37.5635, 127.0367],
  광진구: [37.5384, 127.0822],
  동대문구: [37.5744, 127.0395],
  중랑구: [37.6065, 127.0928],
  성북구: [37.5894, 127.0167],
  강북구: [37.6396, 127.0257],
  도봉구: [37.6688, 127.0471],
  노원구: [37.6541, 127.0568],
  은평구: [37.6027, 126.9291],
  서대문구: [37.5793, 126.9368],
  마포구: [37.5663, 126.9019],
  양천구: [37.5169, 126.8665],
  강서구: [37.5509, 126.8495],
  구로구: [37.4954, 126.8874],
  금천구: [37.4564, 126.8954],
  영등포구: [37.5263, 126.8966],
  동작구: [37.5124, 126.9393],
  관악구: [37.4784, 126.9516],
  서초구: [37.4837, 127.0324],
  강남구: [37.5172, 127.0473],
  송파구: [37.5145, 127.1059],
  강동구: [37.5301, 127.1238],
};

function locateByNameSync(workPlcNm: string): { lat: number; lng: number } | null {
  for (const [gu, [lat, lng]] of Object.entries(SEOUL_GU_LATLNG)) {
    if (workPlcNm.includes(gu)) return { lat, lng };
  }
  return null;
}

/** 서울 자치구 fallback 우선 → 안 맞으면 Kakao geocoding (서울 외 지역) → 둘 다 실패 시 종로 중심값 */
async function locateByName(workPlcNm: string): Promise<{ lat: number; lng: number }> {
  const sync = locateByNameSync(workPlcNm);
  if (sync) return sync;

  if (isKakaoAvailable() && workPlcNm.trim()) {
    const geo = await geocodeKeyword(workPlcNm);
    if (geo) return { lat: geo.lat, lng: geo.lng };
  }

  return { lat: 37.5703, lng: 126.9824 }; // 최종 폴백 (종로구)
}

async function toJob(item: SenuriJobItem): Promise<Job> {
  const activity = EMPLYMSHP_TO_ACTIVITY[item.emplymShp] ?? "민간";
  const { lat, lng } = await locateByName(item.workPlcNm);
  const expiresAt = parseDate(item.toDd).toISOString();
  return {
    id: `j-senuri-${item.jobId}`,
    source: "노인인력개발원",
    sourceId: item.jobId,
    title: item.recrtTitle,
    org: item.oranNm || "(기업 정보 없음)",
    regionCode: item.workPlc, // 코드 그대로 (행정구역 매핑은 S2)
    regionName: item.workPlcNm,
    lat,
    lng,
    jobTags: item.jobclsNm ? [item.jobclsNm] : [],
    activityType: activity,
    difficulty: inferDifficulty(item),
    outdoor: false,
    walkingHeavy: /건설|배달|환경/.test(item.jobclsNm),
    drivingRequired: /운전|배달/.test(item.jobclsNm),
    ageMin: 60,
    agePreferred: null,
    wageKrwPerHour: 9620, // 명세에 시급이 없어서 최저시급으로 가정
    hoursPerWeek: 0,
    timeSlot: inferTimeSlot(item),
    schedule: `${EMPLYMSHP_NAME[item.emplymShp] ?? item.emplymShpNm} · 접수 ${item.frDd}~${item.toDd}`,
    requirements: [item.acptMthd ? `접수: ${item.acptMthd}` : "기관 문의"],
    applyUrl: "https://www.work.go.kr/senuri/",
    contactPhone: "",
    expiresAt,
  };
}

// XML body.items.item[] 파싱 (외부 의존성 없이 정규식)
function parseSenuriXML(xml: string): SenuriJobItem[] {
  const result: SenuriJobItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag: string): string => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`).exec(body);
      return (r?.[1] ?? "").trim();
    };
    result.push({
      jobId: get("jobId"),
      recrtTitle: get("recrtTitle"),
      oranNm: get("oranNm"),
      workPlcNm: get("workPlcNm"),
      workPlc: get("workPlc"),
      emplymShp: get("emplymShp"),
      emplymShpNm: get("emplymShpNm"),
      jobcls: get("jobcls"),
      jobclsNm: get("jobclsNm"),
      frDd: get("frDd"),
      toDd: get("toDd"),
      deadline: get("deadline"),
      acptMthd: get("acptMthd"),
      stmId: get("stmId"),
      stmNm: get("stmNm"),
    });
  }
  return result;
}

// resultCode 추출 — 00 정상, 그 외 에러
function parseResultCode(xml: string): { code: string; msg: string } {
  const code = /<resultCode>(.*?)<\/resultCode>/.exec(xml)?.[1]?.trim() ?? "";
  const msg = /<resultMsg>(.*?)<\/resultMsg>/.exec(xml)?.[1]?.trim() ?? "";
  return { code, msg };
}

export const kordiAdapter: JobAdapter = {
  source: "kordi",
  refreshIntervalMin: 60 * 24, // 일 1회 (가이드 §4.1)
  isAvailable() {
    return Boolean(process.env.KORDI_API_KEY);
  },
  async fetch(): Promise<Job[]> {
    if (!process.env.KORDI_API_KEY) {
      // 키 없으면 정적 시드(2020 CSV 기반 36건)로 폴백
      return [...realSampleJobs];
    }

    // 5 페이지(× 100건) = 최대 500건 풀로 확장 — 전국 지역 다양성 확보
    const PAGES = 5;
    const PER_PAGE = 100;
    const allItems: SenuriJobItem[] = [];

    for (let p = 1; p <= PAGES; p++) {
      const url = new URL(`${KORDI_BASE}/getJobList`);
      url.searchParams.set("ServiceKey", process.env.KORDI_API_KEY!);
      url.searchParams.set("pageNo", String(p));
      url.searchParams.set("numOfRows", String(PER_PAGE));

      try {
        const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
        if (!res.ok) {
          console.warn(`[kordi] page ${p} HTTP ${res.status}`);
          if (p === 1) return [...realSampleJobs]; // 첫 페이지 실패 시 sample 폴백
          break;
        }
        const text = await res.text();
        const { code, msg } = parseResultCode(text);
        if (code && code !== "00" && code !== "0000") {
          console.warn(`[kordi] page ${p} resultCode=${code} (${msg})`);
          if (p === 1) return [...realSampleJobs];
          break;
        }
        const items = parseSenuriXML(text);
        if (items.length === 0) break; // 더 이상 데이터 없음
        allItems.push(...items);
        if (items.length < PER_PAGE) break; // 마지막 페이지
      } catch (e) {
        console.warn(`[kordi] page ${p} error`, e);
        if (p === 1) return [...realSampleJobs];
        break;
      }
    }

    if (allItems.length === 0) return [...realSampleJobs];

    // 병렬 geocoding — Kakao 7일 캐시 활용 (동일 지역명은 1회만 호출)
    const jobs = await Promise.all(allItems.map((it) => toJob(it)));
    return jobs;
  },
};
