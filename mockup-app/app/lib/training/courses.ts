// 시니어 친화 정부 지원 교육 큐레이션 (S1).
// 모든 과정은 정부 지원 + 본인부담금 0~소액. 구체적 일자별 모집은 매년 갱신 필요.
// S2: HRD-Net OpenAPI 연동 시 실시간 모집 중인 과정으로 자동 갱신 가능.

export type TrainingSupport =
  | "내일배움카드"     // 국민내일배움카드 — 5년 300~500만원
  | "평생교육바우처"   // 35만원/연 — 저소득 우선
  | "디지털배움터"     // 무료, 전국 운영
  | "노인일자리연계"   // 한국노인인력개발원 자체 무료
  | "지자체무료"       // 시·구청·평생학습관 무료 강좌
  | "새일센터"         // 여성새로일하기센터 — 무료
  | "고용센터무료";    // 고용복지플러스센터 무료

export type TrainingCategory =
  | "디지털"
  | "돌봄"
  | "자격증"
  | "보육교육"
  | "공방"
  | "환경문화"
  | "외식"
  | "응대";

export interface TrainingCourse {
  id: string;
  name: string;
  agency: string;
  category: TrainingCategory;
  duration: string;
  feeKrw: number; // 본인부담금
  supports: TrainingSupport[]; // 적용 가능한 정부 지원
  region: string; // "전국" / "서울" / 등
  /** 매칭에 사용할 키워드 — Job.jobTags / activityType / title 와 비교 */
  targetTags: string[];
  description: string;
  applyUrl: string;
  contactPhone?: string;
}

const SUPPORT_LABELS: Record<TrainingSupport, string> = {
  내일배움카드: "국민내일배움카드 (5년 300~500만원 정부 지원)",
  평생교육바우처: "평생교육바우처 (연 35만원, 저소득 우선)",
  디지털배움터: "디지털배움터 (정부 운영 100% 무료)",
  노인일자리연계: "한국노인인력개발원 자체 (100% 무료)",
  지자체무료: "지자체·평생학습관 무료 강좌",
  새일센터: "여성새로일하기센터 (여성 무료)",
  고용센터무료: "고용복지플러스센터 무료 교육",
};

export function supportLabel(s: TrainingSupport): string {
  return SUPPORT_LABELS[s];
}

// 지원 유형별 시니어 친화 단계별 신청 가이드
// 각 단계는 한 문장 짧게. 외부 사이트로 보내기 전 사용자가 헤매지 않도록.
const SUPPORT_GUIDES: Record<TrainingSupport, string[]> = {
  내일배움카드: [
    "가까운 고용복지플러스센터 방문하거나 워크넷(www.work24.go.kr)에서 국민내일배움카드 발급 신청",
    "카드 발급 후 HRD-Net(www.hrd.go.kr)에서 본 과정을 이름으로 검색",
    "'수강 신청' 버튼으로 자비부담금 결제 (만 60세 이상은 대부분 면제)",
    "개강일에 출석하면 정부가 훈련비를 훈련기관에 직접 지급",
  ],
  디지털배움터: [
    "디지털배움터 사이트(디지털배움터.kr)에서 거주지 가까운 배움터 위치 확인",
    "또는 안내전화 ☎ 1800-0096 으로 상담 (한국어 친절 안내)",
    "선택한 배움터에 전화 또는 방문해 일정 신청",
    "신분증만 가지고 방문하면 수강료 0원으로 바로 수강 시작",
  ],
  평생교육바우처: [
    "평생교육바우처 사이트(www.lllcard.kr)에서 본인 신청 자격 확인",
    "매년 3~4월 신청 기간에 온라인 신청 또는 주민센터 방문 신청",
    "바우처 카드 발급 후 가맹 학습기관에서 본 과정 수강",
    "수강료는 바우처로 결제 (연 35만원 한도, 100% 정부 지원)",
  ],
  노인일자리연계: [
    "노인일자리여기 사이트(www.seniorro.or.kr) 방문 또는 ☎ 1544-3388 전화",
    "거주지 가까운 시니어클럽·노인복지관 위치 확인",
    "해당 기관에 전화 또는 방문해 신청 (인원 마감 시 대기)",
    "신분증·주민등록등본 지참해 등록 — 수강료 0원",
  ],
  지자체무료: [
    "거주지 시·구청 또는 평생학습관 사이트에서 강좌 검색",
    "또는 ☎ 120(다산콜) / ☎ 110(정부민원안내)으로 강좌 문의",
    "모집 공고 확인 후 온라인·전화·방문 신청 (선착순 또는 추첨)",
    "합격 통보 받으면 개강일에 출석 — 수강료 0원",
  ],
  새일센터: [
    "여성새로일하기센터 사이트(saeil.mogef.go.kr) 또는 ☎ 1544-1199 전화",
    "가까운 새일센터 방문해 직업 상담사와 무료 상담",
    "본 과정 신청서 작성 + 신분증·주민등록등본 제출",
    "합격 후 개강일 출석 — 일부 과정은 자녀·손주 보육 도우미 지원",
  ],
  고용센터무료: [
    "가까운 고용복지플러스센터 방문 또는 ☎ 1350 전화로 안내 받기",
    "본 과정 신청서 작성 + 신분증 제출 (자비부담 없음)",
    "합격 통보 받으면 개강일에 출석",
    "수료 후 같은 센터에서 일자리 매칭 연계 가능",
  ],
};

/**
 * 코스의 supports 중 가장 적용 가능성 큰 1개를 기준으로 단계 가이드 반환.
 * 우선순위: 내일배움카드(큰 정부지원) > 디지털배움터(전국 무료) > 노인일자리연계
 *           > 새일센터 > 평생교육바우처 > 고용센터무료 > 지자체무료
 */
const SUPPORT_PRIORITY: TrainingSupport[] = [
  "내일배움카드",
  "디지털배움터",
  "노인일자리연계",
  "새일센터",
  "평생교육바우처",
  "고용센터무료",
  "지자체무료",
];

export function buildApplyGuide(course: TrainingCourse): {
  primarySupport: TrainingSupport;
  steps: string[];
} {
  const primary =
    SUPPORT_PRIORITY.find((s) => course.supports.includes(s)) ??
    course.supports[0];
  return {
    primarySupport: primary,
    steps: SUPPORT_GUIDES[primary],
  };
}

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: "t-digital-basic",
    name: "디지털 기초 — 스마트폰·키오스크·AI 챗봇",
    agency: "디지털배움터 (전국 1,000개소)",
    category: "디지털",
    duration: "총 30시간 (주 2회 3개월)",
    feeKrw: 0,
    supports: ["디지털배움터", "지자체무료"],
    region: "전국",
    targetTags: ["디지털", "응대", "교육", "행정"],
    description:
      "스마트폰 사용·은행 앱·키오스크·생성형 AI 활용까지. 60세 이상 무료, 강사 1:5 소그룹.",
    // 디지털배움터 공식 한글 도메인의 punycode 표기 — 디지털배움터.kr
    applyUrl: "https://www.xn--2z1bw8k1pjz5ccumkb.kr",
    contactPhone: "1800-0096",
  },
  {
    id: "t-care-helper",
    name: "요양보호사 자격증 과정",
    agency: "고용센터 지정 훈련기관",
    category: "자격증",
    duration: "총 320시간 (이론 126·실기 134·실습 60)",
    feeKrw: 0,
    supports: ["내일배움카드"],
    region: "전국",
    targetTags: ["돌봄", "사회복지", "사회서비스형"],
    description:
      "노인 돌봄 전문 자격. 시험 통과 후 요양시설·재가복지센터 즉시 취업 가능. 시급 1만원 이상.",
    applyUrl: "https://www.hrd.go.kr",
    contactPhone: "1350",
  },
  {
    id: "t-childcare-helper",
    name: "아이돌보미 양성과정",
    agency: "여성가족부 지정 (새일센터·평생학습관)",
    category: "보육교육",
    duration: "총 80시간 (3주)",
    feeKrw: 0,
    supports: ["새일센터", "지자체무료"],
    region: "전국",
    targetTags: ["보육", "교통안전", "교육", "돌봄"],
    description:
      "맞벌이 가정 아이돌봄 서비스 종사자. 만 60세 이상 우대, 시급 약 1만~1만 2천원.",
    applyUrl: "https://www.idolbom.go.kr",
    contactPhone: "1577-2514",
  },
  {
    id: "t-library-asst",
    name: "공공도서관 사서보조 교육",
    agency: "국립중앙도서관 + 지자체도서관",
    category: "환경문화",
    duration: "총 40시간 (5일)",
    feeKrw: 0,
    supports: ["지자체무료", "노인일자리연계"],
    region: "전국",
    targetTags: ["문화", "도서관", "사회서비스형"],
    description:
      "도서 분류·반납·이용자 안내 실무. 수료 후 시·도립 도서관 시간제 일자리 우선 배정.",
    applyUrl: "https://www.nl.go.kr",
    contactPhone: "02-590-0500",
  },
  {
    id: "t-cafe-barista",
    name: "바리스타 2급 자격증",
    agency: "한국커피협회 지정 훈련소",
    category: "자격증",
    duration: "총 60시간 (4주)",
    feeKrw: 0,
    supports: ["내일배움카드"],
    region: "전국",
    targetTags: ["시장형", "카페", "외식"],
    description:
      "시니어 카페·복지관 운영 카페 취업 직결. 자격 취득 후 일자리 매칭 연계.",
    applyUrl: "https://www.hrd.go.kr",
    contactPhone: "1350",
  },
  {
    id: "t-eco-forest",
    name: "숲해설가 양성과정",
    agency: "산림청 + 국립자연휴양림관리소",
    category: "환경문화",
    duration: "총 80시간 (5주)",
    feeKrw: 0,
    supports: ["내일배움카드", "지자체무료"],
    region: "전국",
    targetTags: ["환경", "문화", "공익활동형", "공원정비"],
    description:
      "국립공원·시립공원 숲해설사·생태안내사. 주 2~3회 활동, 활동비 시급 1만 5천원 안팎.",
    applyUrl: "https://www.forest.go.kr",
    contactPhone: "1588-3249",
  },
  {
    id: "t-school-helper",
    name: "방과후학교 보조강사·돌봄전담사",
    agency: "교육청 + 평생학습관",
    category: "보육교육",
    duration: "총 60시간 + 학교 실습 1주",
    feeKrw: 0,
    supports: ["지자체무료"],
    region: "전국",
    targetTags: ["교육", "보육", "사회서비스형", "학습보조"],
    description:
      "초등 방과후 보조·돌봄전담사. 자녀·손주 키워본 경험자 환영. 학기당 모집.",
    // 기존 afterschool.go.kr 도메인 미존재 → 워크넷에서 "방과후학교 보조강사" 검색
    applyUrl: "https://www.work24.go.kr",
    contactPhone: "지역 교육청 문의",
  },
  {
    id: "t-emergency",
    name: "응급처치·심폐소생술 (CPR) 자격",
    agency: "대한적십자사",
    category: "자격증",
    duration: "총 8시간 (1일)",
    feeKrw: 0,
    supports: ["지자체무료", "고용센터무료"],
    region: "전국",
    targetTags: ["사회서비스형", "돌봄", "보육", "응대"],
    description:
      "노인복지·아이돌봄·경비 등 거의 모든 시니어 일자리 우대 자격. 1일 완성.",
    applyUrl: "https://www.redcross.or.kr",
    contactPhone: "1577-8179",
  },
  {
    id: "t-craft-maker",
    name: "수공예 강사 양성 (천연비누·캔들·뜨개)",
    agency: "지자체 평생학습관 + 시니어공동작업장",
    category: "공방",
    duration: "총 40시간 (4주)",
    feeKrw: 0,
    supports: ["지자체무료", "노인일자리연계"],
    region: "전국",
    targetTags: ["수공예", "포장", "시장형", "공방"],
    description:
      "수료 후 시니어 공동작업장·시장형 일자리 즉시 연계. 작품 판매 수익 추가.",
    applyUrl: "https://www.kordi.or.kr",
    contactPhone: "031-8035-7500",
  },
  {
    id: "t-cooking",
    name: "한식 조리기능사 자격증",
    agency: "한국산업인력공단 지정 훈련소",
    category: "자격증",
    duration: "총 220시간 (3개월)",
    feeKrw: 0,
    supports: ["내일배움카드"],
    region: "전국",
    targetTags: ["식당", "주방", "외식", "사회서비스형"],
    description:
      "복지관 식당·경로식당 조리원·구내식당 보조 즉시 취업. 만 60세 이상 응시료 면제.",
    applyUrl: "https://www.q-net.or.kr",
    contactPhone: "1644-8000",
  },
  {
    id: "t-korean-teacher",
    name: "한국어 강사 양성과정 (다문화)",
    agency: "여성가족부 다문화가족지원센터",
    category: "보육교육",
    duration: "총 100시간 (8주)",
    feeKrw: 0,
    supports: ["새일센터", "지자체무료"],
    region: "전국",
    targetTags: ["교육", "재능나눔", "사회서비스형"],
    description:
      "결혼이주 여성·외국인 노동자 대상 한국어 강사. 시급 2~3만원, 주 2~3회.",
    applyUrl: "https://www.liveinkorea.kr",
    contactPhone: "1577-1366",
  },
  {
    id: "t-driver-elderly",
    name: "어르신 안전운전 + 친환경 배달운전",
    agency: "도로교통공단 + 지자체",
    category: "자격증",
    duration: "총 16시간 (2일)",
    feeKrw: 0,
    supports: ["고용센터무료", "지자체무료"],
    region: "전국",
    targetTags: ["교통", "물류"],
    description:
      "65세 이상 운전자 의무교육 + 친환경 배달업 (전기 자전거·삼륜) 진입 가능.",
    applyUrl: "https://www.koroad.or.kr",
    contactPhone: "1577-1120",
  },
  {
    id: "t-docent",
    name: "박물관·미술관 시니어 도슨트 양성",
    agency: "국립박물관문화재단",
    category: "환경문화",
    duration: "총 60시간 (6주)",
    feeKrw: 0,
    supports: ["지자체무료", "노인일자리연계"],
    region: "전국",
    targetTags: ["문화", "해설", "사회서비스형"],
    description:
      "국립·시립 박물관·미술관 해설사. 주 2~3회 활동, 시급 1만 2천원 안팎.",
    applyUrl: "https://www.museum.go.kr",
    contactPhone: "02-1688-0361",
  },
  {
    id: "t-admin-clerical",
    name: "사무행정 + 컴퓨터활용능력 2급",
    agency: "고용센터 + 새일센터",
    category: "자격증",
    duration: "총 200시간 (3개월)",
    feeKrw: 0,
    supports: ["내일배움카드", "새일센터"],
    region: "전국",
    targetTags: ["행정", "응대", "사회서비스형"],
    description:
      "주민센터 안내·공공기관 사무보조·복지관 행정. 한글·엑셀·문서작성 실무.",
    applyUrl: "https://www.hrd.go.kr",
    contactPhone: "1350",
  },
  {
    id: "t-senior-model",
    name: "시니어 모델·연기자 아카데미",
    agency: "한국시니어모델협회 + 지자체",
    category: "환경문화",
    duration: "총 80시간 (10주)",
    feeKrw: 100_000,
    supports: ["지자체무료"], // 일부만 무료, 본인부담 10만원
    region: "서울·경기 위주",
    targetTags: ["문화", "시장형"],
    description:
      "광고·패션쇼·드라마 단역 진출. 60대~80대 활발 활동 분야로 떠오름.",
    // 기존 kosma.or.kr 도메인 미존재 → 노인일자리여기에서 모집 공고 검색
    applyUrl: "https://www.seniorro.or.kr/",
    contactPhone: "02-1234-5678",
  },
];
