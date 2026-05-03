// 문화누리카드 연계 활동 — 정적 큐레이션 (MVP)
// 출처: 문화누리카드 사용처 (영화·공연·전시·국내여행·교통·숙박)
// + 시니어 친화 콘텐츠 우선

export type CultureCategory =
  | "영화"
  | "공연"
  | "전시"
  | "국내여행"
  | "도서"
  | "체육";

export interface CultureActivity {
  id: string;
  category: CultureCategory;
  title: string;
  description: string;
  estimatedCost: string; // "본인부담 0원~5,000원"
  cardUsage: string; // "문화누리카드로 결제 가능"
  partnerName?: string;
  bookingUrl?: string;
  tip?: string;
  emoji: string;
  seniorDiscount?: string; // 시니어 추가 할인
}

export const CULTURE_ACTIVITIES: CultureActivity[] = [
  {
    id: "culture-cgv-senior",
    category: "영화",
    title: "CGV 노블레스관 (만 60세 이상)",
    description: "전국 CGV에서 평일·주말 모두 7,000원에 영화 관람",
    estimatedCost: "본인부담 0원 ~ 7,000원",
    cardUsage: "문화누리카드로 결제 가능",
    partnerName: "CGV",
    bookingUrl: "https://www.cgv.co.kr",
    seniorDiscount: "만 60세 이상 7,000원 (일반관 기준)",
    tip: "조조(오전)·심야 시간대는 더 저렴해요.",
    emoji: "🎬",
  },
  {
    id: "culture-megabox-senior",
    category: "영화",
    title: "메가박스 시니어 할인",
    description: "만 60세 이상 본인 한정 5,000원 영화 관람 (일부 점)",
    estimatedCost: "본인부담 0원 ~ 5,000원",
    cardUsage: "문화누리카드로 결제 가능",
    partnerName: "메가박스",
    bookingUrl: "https://www.megabox.co.kr",
    seniorDiscount: "만 60세 이상 5,000원",
    emoji: "🎬",
  },
  {
    id: "culture-sejong-center",
    category: "공연",
    title: "세종문화회관 공연",
    description: "오케스트라·뮤지컬·전시 등 다양한 공연 관람",
    estimatedCost: "공연별 5,000원~50,000원",
    cardUsage: "문화누리카드로 결제 가능",
    partnerName: "세종문화회관",
    bookingUrl: "https://www.sejongpac.or.kr",
    seniorDiscount: "만 65세 이상 30~50% 할인 공연 다수",
    tip: "공연 1시간 전 도착하시면 여유롭게 입장 가능해요.",
    emoji: "🎭",
  },
  {
    id: "culture-sac",
    category: "공연",
    title: "예술의전당 클래식·전시",
    description: "한가람미술관 전시 + 콘서트홀 클래식 공연",
    estimatedCost: "전시 5,000원~ / 공연 10,000원~",
    cardUsage: "문화누리카드로 결제 가능",
    partnerName: "예술의전당",
    bookingUrl: "https://www.sac.or.kr",
    seniorDiscount: "만 65세 이상 일부 공연 50% 할인",
    emoji: "🎼",
  },
  {
    id: "culture-mmca-special",
    category: "전시",
    title: "국립현대미술관 특별전 (서울/덕수궁/과천)",
    description: "상설전 무료 외 특별전도 시니어 무료 또는 큰 폭 할인",
    estimatedCost: "본인부담 0원 ~ 4,000원",
    cardUsage: "문화누리카드로 결제 가능",
    partnerName: "국립현대미술관",
    bookingUrl: "https://www.mmca.go.kr",
    seniorDiscount: "만 65세 이상 무료 (특별전 일부 50% 할인)",
    emoji: "🎨",
  },
  {
    id: "culture-leeum",
    category: "전시",
    title: "리움미술관·아라리오뮤지엄 등 사립 미술관",
    description: "현대미술 사립 미술관 다수에서 시니어 할인",
    estimatedCost: "본인부담 5,000원~",
    cardUsage: "문화누리카드로 결제 가능",
    seniorDiscount: "만 65세 이상 약 50% 할인",
    tip: "리움미술관은 사전 예약제예요.",
    emoji: "🖼",
  },
  {
    id: "culture-ktx-senior",
    category: "국내여행",
    title: "KTX 경로 할인 (만 65세 이상 30%)",
    description: "전국 KTX 노선 평일 30% 할인 (주말·공휴일 제외)",
    estimatedCost: "노선별 본인부담 다름",
    cardUsage: "문화누리카드로 결제 가능 (일부)",
    partnerName: "코레일",
    bookingUrl: "https://www.korail.com",
    seniorDiscount: "만 65세 이상 평일 30% 할인",
    tip: "출발 1개월 전 예매하시면 좌석 확보가 쉬워요.",
    emoji: "🚄",
  },
  {
    id: "culture-tour-tip",
    category: "국내여행",
    title: "한국관광공사 시니어 여행 코스",
    description: "공식 추천 시니어 친화 국내 여행 코스 안내",
    estimatedCost: "코스별 본인부담 다름",
    cardUsage: "숙박·교통·체험 일부 결제 가능",
    partnerName: "한국관광공사",
    bookingUrl: "https://korean.visitkorea.or.kr",
    emoji: "🗺",
  },
  {
    id: "culture-library",
    category: "도서",
    title: "공공도서관 신간 도서·잡지",
    description: "전국 공공도서관에서 도서 대출 + 잡지·신문 무료 열람",
    estimatedCost: "본인부담 0원",
    cardUsage: "도서 구매는 문화누리카드 사용 가능",
    seniorDiscount: "전 연령 무료",
    tip: "도서관 디지털기기 교실도 무료로 들으실 수 있어요.",
    emoji: "📚",
  },
  {
    id: "culture-fitness",
    category: "체육",
    title: "공공체육시설·국민체육진흥공단",
    description: "수영장·헬스장·게이트볼장 등 시·군·구 운영 시설",
    estimatedCost: "본인부담 1,000원 ~ 5,000원",
    cardUsage: "문화누리카드로 결제 가능 (체육 사용처)",
    seniorDiscount: "만 65세 이상 50~100% 할인 시설 다수",
    tip: "거주 시·군·구 체육시설을 검색해보세요.",
    emoji: "🏊",
  },
];

export function getCultureByCategory(): Map<CultureCategory, CultureActivity[]> {
  const map = new Map<CultureCategory, CultureActivity[]>();
  for (const a of CULTURE_ACTIVITIES) {
    if (!map.has(a.category)) map.set(a.category, []);
    map.get(a.category)!.push(a);
  }
  return map;
}
