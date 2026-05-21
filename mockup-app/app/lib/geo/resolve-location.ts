// 사용자 (region, district) → (dongCode, dongName, lat, lng) 결정 헬퍼.
// onboarding/complete + profile/update가 같은 좌표 결정 로직을 공유하도록 추출.
//
// 우선순위:
//   1. Kakao geocoding (region + district 모두 있을 때, KAKAO_REST_API_KEY 등록 시)
//   2. 서울 자치구 정적 매핑 (DONG_BY_DISTRICT — 카카오 폴백)
//   3. fallback 좌표 (호출자가 넘긴 기존 사용자 lat/lng)
//
// dongCode는 region+district 조합으로 표준화 → 시드/매칭 단계에서 광역 일치 식별 보장.
//
import { geocodeAddress, isKakaoAvailable } from "./kakao";

// 서울 7개 자치구만 정적 매핑 (kakao 키 미설정 시 폴백용). 나머지는 region+district 조합 키로 표준화.
const DONG_BY_DISTRICT: Record<string, { code: string; name: string; lat: number; lng: number }> = {
  "종로구": { code: "1111051500", name: "종로구 종로1·2·3·4가동", lat: 37.5703, lng: 126.9824 },
  "중구":   { code: "1114052000", name: "중구 회현동",            lat: 37.5589, lng: 126.9789 },
  "용산구": { code: "1117052000", name: "용산구 용산2가동",        lat: 37.5326, lng: 126.9909 },
  "성북구": { code: "1129052000", name: "성북구 성북동",            lat: 37.5894, lng: 127.0067 },
  "마포구": { code: "1144052000", name: "마포구 공덕동",            lat: 37.5440, lng: 126.9519 },
  "강남구": { code: "1168052000", name: "강남구 역삼1동",            lat: 37.5008, lng: 127.0367 },
  "송파구": { code: "1171052000", name: "송파구 잠실본동",            lat: 37.5145, lng: 127.0987 },
};

export interface LocationResolution {
  dongCode: string;
  dongName: string;
  lat: number;
  lng: number;
}

export interface ResolveFallback {
  dongCode: string;
  dongName: string;
  lat: number;
  lng: number;
}

/**
 * region/district 입력으로 위치 정보를 확정한다.
 *
 * @param region   "서울특별시" 같은 시·도 풀네임 (null/undefined면 폴백)
 * @param district "종로구" 같은 시·군·구 (null/undefined면 폴백)
 * @param fallback 변경 안 됐을 때 유지할 기존 값 (필수 — 매칭 좌표가 비면 안 됨)
 */
export async function resolveLocation(
  region: string | null | undefined,
  district: string | null | undefined,
  fallback: ResolveFallback,
): Promise<LocationResolution> {
  // 서울 자치구 정적 매핑 우선 시도 (Kakao 없을 때를 위해)
  const dongFallback = district ? DONG_BY_DISTRICT[district] : null;

  // dongCode 표준화: region+district 조합으로 비-서울도 고유 식별 보장
  const standardizedDongCode =
    region && district
      ? `R_${region}_${district}`.replace(/\s+/g, "_")
      : (dongFallback?.code ?? fallback.dongCode);

  let lat = dongFallback?.lat ?? fallback.lat;
  let lng = dongFallback?.lng ?? fallback.lng;
  let dongName =
    dongFallback?.name ??
    (region || district ? `${region ?? ""} ${district ?? ""}`.trim() : fallback.dongName);

  // Kakao 사용 가능 + 둘 다 있으면 정확한 좌표로 덮어쓰기
  if (isKakaoAvailable() && region && district) {
    const fullAddr = `${region} ${district}`;
    const geo = await geocodeAddress(fullAddr);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      if (geo.matchedAddress) dongName = geo.matchedAddress;
    }
  }

  return { dongCode: standardizedDongCode, dongName, lat, lng };
}
