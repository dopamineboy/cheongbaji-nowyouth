// 사용자가 입력한 region(시·도)과 실제 lat/lng가 일관성 없는지 감지.
// 기존 사용자(옛 cookie)의 경우:
//   1) 인터뷰 시점에 region="부산광역시"라고 적었더라도 DONG_BY_DISTRICT(서울 7개)에
//      해당 자치구가 없어서 lat/lng가 sampleUser 종로 좌표(37.5703, 126.9824)로 떨어진
//      케이스가 있었음.
//   2) Kakao geocoding이 KORDI 키 등록 전엔 작동 안 해서 옛 사용자는 시·도 중심값이 아닌
//      서울 좌표를 들고 다님.
//
// 이걸 마이페이지 진입 시 감지해서 자동 마이그레이션 트리거에 사용.
//
import { haversineKm } from "../jobs/match";
import type { UserProfile } from "../types";

// 17개 시·도 대표 좌표 (시·도 중심부)
const REGION_CENTER_LATLNG: Record<string, [number, number]> = {
  서울특별시: [37.5665, 126.978],
  부산광역시: [35.1796, 129.0756],
  대구광역시: [35.8714, 128.6014],
  인천광역시: [37.4563, 126.7052],
  광주광역시: [35.1595, 126.8526],
  대전광역시: [36.3504, 127.3845],
  울산광역시: [35.5384, 129.3114],
  세종특별자치시: [36.4801, 127.289],
  경기도: [37.4138, 127.5183],
  강원특별자치도: [37.8228, 128.1555],
  충청북도: [36.6357, 127.4917],
  충청남도: [36.5184, 126.8],
  전북특별자치도: [35.7175, 127.153],
  전라남도: [34.8161, 126.463],
  경상북도: [36.4919, 128.8889],
  경상남도: [35.4606, 128.2132],
  제주특별자치도: [33.4996, 126.5312],
};

const STALE_DISTANCE_KM = 100; // 시·도 중심에서 100km 초과면 stale로 간주

/**
 * 사용자의 region이 입력되어 있지만 lat/lng가 그 시·도 중심에서 100km 이상 떨어져 있으면
 * stale(=옛 사용자가 인터뷰 후 좌표 자동 갱신 못 받은 상태)으로 판단.
 *
 * region이 비어있거나 매핑에 없으면 false (검증 불가).
 */
export function isLocationStale(user: UserProfile): boolean {
  if (!user.region) return false;
  const center = REGION_CENTER_LATLNG[user.region];
  if (!center) return false;
  const dist = haversineKm(user.lat, user.lng, center[0], center[1]);
  return dist > STALE_DISTANCE_KM;
}
