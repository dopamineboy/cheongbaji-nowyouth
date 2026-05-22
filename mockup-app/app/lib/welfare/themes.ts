// 복지 혜택을 광역 테마로 묶기 위한 매핑.
// yml의 category 필드는 16종(돌봄 vs 돌봄서비스 vs 돌봄·간병 등 표기 분산)이라
// 사용자에게는 일관된 11개 테마(의료/돌봄/주거 등)로 정리해서 노출.
//
// "기초생활보장" 같이 housing/living/medical 셋이 같은 category를 쓰는 경우는
// benefit.id(파일명)로 override.
//
import type { Benefit } from "./matcher";

export type ThemeId =
  | "medical"      // 🏥 의료·건강
  | "income"       // 💰 소득·연금
  | "housing"      // 🏠 주거·에너지
  | "living"       // 🪙 생계·생활비 절감
  | "transport"    // 🚌 교통·이동
  | "care"         // 🤲 돌봄·간병
  | "culture"      // 🎭 문화·여가·교육
  | "safety"       // 🛡️ 안전·위기지원
  | "disability"   // 🦽 장애인 지원
  | "meal"         // 🍽️ 식사·영양
  | "employment"   // 💼 일자리·사회활동
  | "other";       // 📋 기타

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  icon: string;
  description: string;
}

// 시니어가 자주 찾는 순서로 배열 — 칩 표시 순서가 됨
export const THEMES: ThemeMeta[] = [
  { id: "medical",    label: "의료·건강",    icon: "🏥", description: "병원비·검진·예방접종·보청기 등" },
  { id: "income",     label: "소득·연금",    icon: "💰", description: "기초연금·주택연금·농지연금" },
  { id: "housing",    label: "주거·에너지",  icon: "🏠", description: "주거급여·전기료·수리비" },
  { id: "living",     label: "생계·생활비",  icon: "🪙", description: "통신비·TV료·수도료 감면" },
  { id: "transport",  label: "교통·이동",    icon: "🚌", description: "지하철·KTX·교통카드" },
  { id: "care",       label: "돌봄·간병",    icon: "🤲", description: "장기요양·맞춤돌봄·방문" },
  { id: "culture",    label: "문화·여가",    icon: "🎭", description: "도서관·공원·평생교육·디지털" },
  { id: "safety",     label: "안전·위기",    icon: "🛡️", description: "응급안전·긴급복지·학대보호" },
  { id: "disability", label: "장애인 지원",  icon: "🦽", description: "장애수당·장애연금" },
  { id: "meal",       label: "식사·영양",    icon: "🍽️", description: "경로식당·도시락 배달" },
  { id: "employment", label: "일자리",      icon: "💼", description: "노인일자리 사업" },
];

export const THEMES_BY_ID: Record<ThemeId, ThemeMeta> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemeMeta>;

// benefit.id로 직접 override (category가 모호한 케이스)
const ID_OVERRIDE: Record<string, ThemeId> = {
  "basic-livelihood-housing":  "housing",
  "basic-livelihood-living":   "living",
  "basic-livelihood-medical":  "medical",
};

// yml category → 테마 매핑
const CATEGORY_TO_THEME: Record<string, ThemeId> = {
  "건강·의료":         "medical",
  "노후소득보장":      "income",
  "주거":              "housing",
  "주거·에너지":       "housing",
  "생활비절감":        "living",
  "기초생활보장":      "living",     // override 없으면 생계로 (대표)
  "교통":              "transport",
  "교통·이동":         "transport",
  "돌봄":              "care",
  "돌봄서비스":        "care",
  "돌봄·간병":         "care",
  "문화여가":          "culture",
  "문화·여가":         "culture",
  "안전·보호":         "safety",
  "안전·돌봄":         "safety",
  "위기지원":          "safety",
  "장애인지원":        "disability",
  "식사·영양":         "meal",
  "일자리·사회활동":   "employment",
  "복지서비스":        "other",
};

export function getTheme(benefit: Benefit): ThemeId {
  if (ID_OVERRIDE[benefit.id]) return ID_OVERRIDE[benefit.id];
  return CATEGORY_TO_THEME[benefit.category] ?? "other";
}

/** 매칭 결과 리스트를 테마별로 그룹화 — 빈 테마는 제외. */
export function groupByTheme<T extends { benefit: Benefit }>(
  list: T[],
): { theme: ThemeMeta; items: T[] }[] {
  const buckets = new Map<ThemeId, T[]>();
  for (const m of list) {
    const t = getTheme(m.benefit);
    const arr = buckets.get(t) ?? [];
    arr.push(m);
    buckets.set(t, arr);
  }
  // THEMES 배열 순서대로 정렬
  return THEMES.flatMap((meta) => {
    const items = buckets.get(meta.id);
    if (!items || items.length === 0) return [];
    return [{ theme: meta, items }];
  }).concat(
    buckets.has("other")
      ? [{ theme: { id: "other", label: "기타", icon: "📋", description: "" }, items: buckets.get("other")! }]
      : [],
  );
}

/** 테마별 개수 집계 — 칩 필터에 "(N건)" 표시용. */
export function countByTheme<T extends { benefit: Benefit }>(
  list: T[],
): Record<ThemeId, number> {
  const counts: Partial<Record<ThemeId, number>> = {};
  for (const m of list) {
    const t = getTheme(m.benefit);
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts as Record<ThemeId, number>;
}
