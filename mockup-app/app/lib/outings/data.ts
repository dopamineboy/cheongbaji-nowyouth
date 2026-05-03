// 0원 나들이 — 정적 큐레이션 데이터 (MVP)
// 출처: 만 65세 이상 무료 입장 시설 (궁궐·왕릉·국립박물관·국립공원 등)
// + 서울/수도권 무료 입장 명소

export type Stamina = "easy" | "mid" | "heavy";
export type WeatherFit = "indoor" | "outdoor" | "any";

export interface Spot {
  id: string;
  name: string;
  category: "궁궐" | "박물관·미술관" | "공원·자연" | "전통시장" | "산책로" | "한옥마을";
  region: string; // 시·도
  district: string; // 시·군·구
  nearestStation: string; // 가까운 지하철역
  line: string[]; // 호선 (1·3·5호선 등)
  freeEntry: boolean;
  freeEntryNote: string; // "만 65세 이상 무료" 등
  walkingSteps: number; // 예상 보행 (방문 자체)
  stamina: Stamina;
  weatherFit: WeatherFit;
  needs: string[]; // 준비물
  rewardPoints: number; // 방문 인증 시 포인트
  tip?: string;
  imageEmoji: string;
}

export interface Outing {
  id: string;
  title: string;
  description: string;
  spotIds: string[]; // Spot.id 배열 (방문 순서)
  region: string;
  line: string; // 주 노선 (예: "3호선")
  totalSteps: number; // 합산 예상 보행
  totalMinutes: number;
  stamina: Stamina;
  weatherFit: WeatherFit;
  totalCost: number; // 0이면 0원
  totalRewardPoints: number; // 모든 스탬프 완료 시 보너스 포함
  needs: string[];
  reasonTags: string[]; // "비 오는 날 OK", "역사 좋아하시면", "벤치 많음" 등
}

export const SPOTS: Spot[] = [
  {
    id: "spot-gyeongbokgung",
    name: "경복궁",
    category: "궁궐",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "경복궁역 5번 출구",
    line: ["3호선"],
    freeEntry: true,
    freeEntryNote: "만 65세 이상 신분증 지참 시 무료",
    walkingSteps: 3500,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["신분증", "경로우대 교통카드", "모자", "물"],
    rewardPoints: 300,
    tip: "수문장 교대식(10·14시)을 보시면 더 좋아요. 의자가 곳곳에 있습니다.",
    imageEmoji: "🏯",
  },
  {
    id: "spot-changdeokgung",
    name: "창덕궁",
    category: "궁궐",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "안국역 3번 출구",
    line: ["3호선"],
    freeEntry: true,
    freeEntryNote: "만 65세 이상 무료 (후원은 별도 예약)",
    walkingSteps: 3000,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["신분증"],
    rewardPoints: 300,
    imageEmoji: "🏯",
  },
  {
    id: "spot-jongmyo",
    name: "종묘",
    category: "궁궐",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "종로3가역 11번 출구",
    line: ["1호선", "3호선", "5호선"],
    freeEntry: true,
    freeEntryNote: "만 65세 이상 무료",
    walkingSteps: 2200,
    stamina: "easy",
    weatherFit: "outdoor",
    needs: ["신분증"],
    rewardPoints: 300,
    imageEmoji: "🏯",
  },
  {
    id: "spot-national-museum",
    name: "국립중앙박물관",
    category: "박물관·미술관",
    region: "서울특별시",
    district: "용산구",
    nearestStation: "이촌역 2번 출구",
    line: ["4호선", "경의중앙선"],
    freeEntry: true,
    freeEntryNote: "상설전시 전 연령 무료",
    walkingSteps: 2800,
    stamina: "easy",
    weatherFit: "indoor",
    needs: ["편한 신발"],
    rewardPoints: 300,
    tip: "비 오는 날 추천. 의자·화장실 충분합니다.",
    imageEmoji: "🏛",
  },
  {
    id: "spot-mmca",
    name: "국립현대미술관 서울관",
    category: "박물관·미술관",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "안국역 1번 출구",
    line: ["3호선"],
    freeEntry: true,
    freeEntryNote: "만 65세 이상 무료",
    walkingSteps: 1800,
    stamina: "easy",
    weatherFit: "indoor",
    needs: ["신분증"],
    rewardPoints: 300,
    imageEmoji: "🎨",
  },
  {
    id: "spot-bukchon",
    name: "북촌한옥마을",
    category: "한옥마을",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "안국역 2번 출구",
    line: ["3호선"],
    freeEntry: true,
    freeEntryNote: "거리 산책 무료 (일부 박물관 별도)",
    walkingSteps: 4000,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["편한 신발", "물"],
    rewardPoints: 300,
    tip: "조용한 시간대(오전 일찍·평일)를 추천드려요.",
    imageEmoji: "🏘",
  },
  {
    id: "spot-insadong",
    name: "인사동",
    category: "전통시장",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "안국역 6번 출구",
    line: ["3호선"],
    freeEntry: true,
    freeEntryNote: "거리 구경 무료",
    walkingSteps: 2500,
    stamina: "easy",
    weatherFit: "any",
    needs: [],
    rewardPoints: 200,
    imageEmoji: "🛍",
  },
  {
    id: "spot-gwangjang",
    name: "광장시장",
    category: "전통시장",
    region: "서울특별시",
    district: "종로구",
    nearestStation: "종로5가역 8번 출구",
    line: ["1호선"],
    freeEntry: true,
    freeEntryNote: "구경 무료",
    walkingSteps: 2000,
    stamina: "easy",
    weatherFit: "any",
    needs: [],
    rewardPoints: 200,
    imageEmoji: "🥟",
  },
  {
    id: "spot-cheonggyecheon",
    name: "청계천 산책로",
    category: "산책로",
    region: "서울특별시",
    district: "중구",
    nearestStation: "종각역 5번 출구",
    line: ["1호선"],
    freeEntry: true,
    freeEntryNote: "무료",
    walkingSteps: 3500,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["모자", "물"],
    rewardPoints: 250,
    imageEmoji: "🌊",
  },
  {
    id: "spot-seoul-forest",
    name: "서울숲",
    category: "공원·자연",
    region: "서울특별시",
    district: "성동구",
    nearestStation: "서울숲역 3번 출구",
    line: ["수인분당선"],
    freeEntry: true,
    freeEntryNote: "무료",
    walkingSteps: 4500,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["모자", "물", "편한 신발"],
    rewardPoints: 300,
    tip: "사슴이 있는 생태숲이 가장 인기예요.",
    imageEmoji: "🌳",
  },
  {
    id: "spot-namsan",
    name: "남산 둘레길",
    category: "산책로",
    region: "서울특별시",
    district: "중구",
    nearestStation: "충무로역 4번 출구",
    line: ["3호선", "4호선"],
    freeEntry: true,
    freeEntryNote: "무료 (케이블카는 별도)",
    walkingSteps: 6000,
    stamina: "heavy",
    weatherFit: "outdoor",
    needs: ["편한 신발", "물", "모자"],
    rewardPoints: 400,
    imageEmoji: "⛰",
  },
  {
    id: "spot-han-river",
    name: "한강공원 (여의도)",
    category: "공원·자연",
    region: "서울특별시",
    district: "영등포구",
    nearestStation: "여의나루역 2번 출구",
    line: ["5호선"],
    freeEntry: true,
    freeEntryNote: "무료",
    walkingSteps: 4000,
    stamina: "mid",
    weatherFit: "outdoor",
    needs: ["모자", "물"],
    rewardPoints: 300,
    imageEmoji: "🌉",
  },
];

export const OUTINGS: Outing[] = [
  {
    id: "outing-3line-palace",
    title: "3호선 궁궐·한옥 코스",
    description: "경복궁에서 시작해 북촌 한옥길을 거쳐 국립현대미술관까지 — 역사와 예술을 한 번에",
    spotIds: ["spot-gyeongbokgung", "spot-bukchon", "spot-mmca"],
    region: "서울특별시",
    line: "3호선",
    totalSteps: 9300,
    totalMinutes: 180,
    stamina: "mid",
    weatherFit: "outdoor",
    totalCost: 0,
    totalRewardPoints: 1000, // 3개 스탬프 + 코스 보너스
    needs: ["신분증", "경로우대 교통카드", "모자", "물", "편한 신발"],
    reasonTags: ["역사 좋아하시면", "사진 찍기 좋음", "벤치 많음"],
  },
  {
    id: "outing-4line-museum",
    title: "4호선 박물관 실내 코스",
    description: "국립중앙박물관 한 곳에서 천천히 — 비 오는 날·더운 날에 추천",
    spotIds: ["spot-national-museum"],
    region: "서울특별시",
    line: "4호선",
    totalSteps: 2800,
    totalMinutes: 120,
    stamina: "easy",
    weatherFit: "indoor",
    totalCost: 0,
    totalRewardPoints: 500,
    needs: ["편한 신발"],
    reasonTags: ["비 오는 날 OK", "에어컨", "화장실 가까움", "의자 충분"],
  },
  {
    id: "outing-1line-market",
    title: "1호선 시장·산책 코스",
    description: "종묘에서 광장시장 구경 후 청계천 산책 — 먹거리와 풍경",
    spotIds: ["spot-jongmyo", "spot-gwangjang", "spot-cheonggyecheon"],
    region: "서울특별시",
    line: "1호선",
    totalSteps: 7700,
    totalMinutes: 150,
    stamina: "mid",
    weatherFit: "outdoor",
    totalCost: 0,
    totalRewardPoints: 800,
    needs: ["신분증", "경로우대 교통카드", "편한 신발"],
    reasonTags: ["먹거리 풍부", "사람 구경", "가까운 거리"],
  },
  {
    id: "outing-3line-changdeok",
    title: "3호선 창덕궁·인사동 코스",
    description: "창덕궁 산책 후 인사동에서 차 한 잔 — 여유로운 오후",
    spotIds: ["spot-changdeokgung", "spot-insadong"],
    region: "서울특별시",
    line: "3호선",
    totalSteps: 5500,
    totalMinutes: 150,
    stamina: "mid",
    weatherFit: "any",
    totalCost: 0,
    totalRewardPoints: 700,
    needs: ["신분증", "경로우대 교통카드"],
    reasonTags: ["여유로움", "차 한 잔"],
  },
  {
    id: "outing-bundang-forest",
    title: "수인분당선 서울숲 자연 코스",
    description: "서울숲에서 천천히 자연 한 바퀴 — 사슴 보러 가요",
    spotIds: ["spot-seoul-forest"],
    region: "서울특별시",
    line: "수인분당선",
    totalSteps: 4500,
    totalMinutes: 90,
    stamina: "mid",
    weatherFit: "outdoor",
    totalCost: 0,
    totalRewardPoints: 500,
    needs: ["모자", "물", "편한 신발"],
    reasonTags: ["자연 좋아하시면", "사슴 구경", "벤치 많음"],
  },
];

// 사용자 지역·체력에 맞는 코스 추천 (간단 룰)
export function recommendOutings(opts: {
  region?: string;
  stamina?: Stamina;
  raining?: boolean;
  walkingHeavyOk?: boolean;
}): Outing[] {
  const { region, raining, walkingHeavyOk } = opts;
  let pool = [...OUTINGS];
  // 지역 매칭 — 서울이면 서울만, 그 외면 모두 (MVP 데이터 부족)
  if (region && region.includes("서울")) {
    pool = pool.filter((o) => o.region === "서울특별시");
  }
  // 비 오는 날 → indoor 우선
  if (raining) {
    pool.sort((a, b) => {
      const ai = a.weatherFit === "indoor" ? 0 : a.weatherFit === "any" ? 1 : 2;
      const bi = b.weatherFit === "indoor" ? 0 : b.weatherFit === "any" ? 1 : 2;
      return ai - bi;
    });
  }
  // 걷기 부담 사용자 → easy 우선
  if (walkingHeavyOk === false) {
    pool.sort((a, b) => {
      const w = (s: Stamina) => (s === "easy" ? 0 : s === "mid" ? 1 : 2);
      return w(a.stamina) - w(b.stamina);
    });
  }
  return pool;
}

export function getSpotsByIds(ids: string[]): Spot[] {
  return ids
    .map((id) => SPOTS.find((s) => s.id === id))
    .filter((s): s is Spot => !!s);
}

export function getOutingById(id: string): Outing | null {
  return OUTINGS.find((o) => o.id === id) ?? null;
}

// 지하철 무료 적용 지역 (만 65세 이상 도시철도 무임 — 모든 지역 적용)
export function isSubwayFree(region?: string): boolean {
  // 만 65세 이상 도시철도 무임승차 (전국 공통)
  return !!region;
}
