// Kakao Local API 헬퍼 — 주소·키워드 → 좌표 변환
// 환경: env.KAKAO_REST_API_KEY 필요
//
// Free tier: 월 30만 건 / Geocoding + Keyword Search 합산.
// fetch cache 7일 사용으로 동일 주소 반복 호출 시 0건 추가 호출.

const BASE = "https://dapi.kakao.com/v2/local/search";

interface KakaoDoc {
  address_name?: string;
  road_address_name?: string;
  place_name?: string;
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
}

interface KakaoResponse {
  documents: KakaoDoc[];
  meta: { total_count: number; pageable_count?: number };
}

export interface GeoResult {
  lat: number;
  lng: number;
  matchedAddress?: string;
  source: "address" | "keyword";
}

function authHeader(): Record<string, string> | null {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  return { Authorization: `KakaoAK ${key}` };
}

async function callKakao(url: string): Promise<KakaoResponse | null> {
  const headers = authHeader();
  if (!headers) return null;
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 60 * 60 * 24 * 7 }, // 7일 캐시
    });
    if (!res.ok) {
      console.warn(`[kakao] HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as KakaoResponse;
  } catch (e) {
    console.warn("[kakao] fetch error", e);
    return null;
  }
}

/** 정형 주소 → 좌표 (도로명/지번 가능) */
export async function geocodeAddress(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null;
  const url = `${BASE}/address.json?query=${encodeURIComponent(query)}`;
  const data = await callKakao(url);
  const doc = data?.documents?.[0];
  if (!doc) return null;
  return {
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    matchedAddress: doc.road_address_name ?? doc.address_name,
    source: "address",
  };
}

/** 자유 키워드 → 좌표 (장소명·기관명 검색) */
export async function geocodeKeyword(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null;
  const url = `${BASE}/keyword.json?query=${encodeURIComponent(query)}&size=1`;
  const data = await callKakao(url);
  const doc = data?.documents?.[0];
  if (!doc) return null;
  return {
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    matchedAddress: doc.address_name ?? doc.place_name,
    source: "keyword",
  };
}

/** 주소 우선 → 실패 시 키워드 폴백 */
export async function geocode(query: string): Promise<GeoResult | null> {
  return (await geocodeAddress(query)) ?? (await geocodeKeyword(query));
}

export function isKakaoAvailable(): boolean {
  return Boolean(process.env.KAKAO_REST_API_KEY);
}
