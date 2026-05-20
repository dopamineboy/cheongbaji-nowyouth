// 인메모리 데이터 스토어 (MVP S1).
// S2에서 PostgreSQL/Supabase로 갈아끼움 — 인터페이스만 유지하면 호환.
//
// ⚠ Next.js dev/prod 인스턴스 간 메모리 공유 안 됨.
// 데모/시연 목적 한정. 사용자 생성 데이터는 새로고침 시 유실 가능.
// 단, 설문 응답은 content/surveys/responses.jsonl 에 append되어 재시작 후에도 유지.

import fs from "node:fs";
import path from "node:path";
import { samplePoomasiPosts, sampleUser } from "./sample-data";
import { realSampleJobs } from "./sample-jobs-real";
import type {
  Job,
  LedgerEntry,
  PoomasiPost,
  SurveyAgeBand,
  SurveyPainPoint,
  SurveyResponse,
  SurveyUsagePeriod,
  UserProfile,
} from "./types";

interface Store {
  users: Map<string, UserProfile>;
  jobs: Job[];
  poomasi: PoomasiPost[];
  ledger: LedgerEntry[];
  surveys: SurveyResponse[];
}

declare global {
  // eslint-disable-next-line no-var
  var __cheongbajiStore: Store | undefined;
}

function makeStore(): Store {
  const users = new Map<string, UserProfile>();
  users.set(sampleUser.id, sampleUser);
  return {
    users,
    jobs: [...realSampleJobs],
    poomasi: [...samplePoomasiPosts],
    surveys: [],
    ledger: [
      // 시연용 초기 적립 내역
      {
        id: "l-init-001",
        userId: sampleUser.id,
        type: "GAME",
        amount: 20,
        metadata: { game: "숫자기억" },
        source: "USER_ACTION",
        createdAt: "2026-04-30T07:30:00Z",
        immutable: true,
      },
      {
        id: "l-init-002",
        userId: sampleUser.id,
        type: "LEARN",
        amount: 10,
        metadata: { quiz: "기초연금" },
        source: "USER_ACTION",
        createdAt: "2026-04-30T08:00:00Z",
        immutable: true,
      },
      {
        id: "l-init-003",
        userId: sampleUser.id,
        type: "WELFARE",
        amount: 100,
        metadata: { welfareId: "w-006" },
        source: "SYSTEM_AWARD",
        createdAt: "2026-04-28T11:00:00Z",
        immutable: true,
      },
    ],
  };
}

export function getStore(): Store {
  if (!globalThis.__cheongbajiStore) {
    globalThis.__cheongbajiStore = makeStore();
    // 설문 응답을 디스크에서 hydrate (Vercel 등 readonly fs 환경에서는 자동 skip)
    hydrateSurveysFromDisk(globalThis.__cheongbajiStore);
  }
  return globalThis.__cheongbajiStore;
}

// ── 설문 파일 영속화 ──────────────────────────────────────────
// Vercel serverless 환경(VERCEL=1)은 readonly fs라 디스크 쓰기 skip.
// 로컬·시연용 서버에서는 content/surveys/responses.jsonl 에 append.

const SURVEY_FILE = path.join(
  process.cwd(),
  "content",
  "surveys",
  "responses.jsonl",
);

function canPersistSurveys(): boolean {
  return process.env.VERCEL !== "1";
}

function hydrateSurveysFromDisk(store: Store): void {
  if (!canPersistSurveys()) return;
  try {
    if (!fs.existsSync(SURVEY_FILE)) return;
    const raw = fs.readFileSync(SURVEY_FILE, "utf-8");
    const loaded: SurveyResponse[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        loaded.push(JSON.parse(trimmed) as SurveyResponse);
      } catch {
        // 손상된 라인은 무시
      }
    }
    // 최신순 정렬 (createdAt 내림차순)
    loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    store.surveys = loaded;
  } catch (err) {
    console.warn("[store] survey hydrate skipped:", err);
  }
}

function appendSurveyToDisk(resp: SurveyResponse): void {
  if (!canPersistSurveys()) return;
  try {
    fs.mkdirSync(path.dirname(SURVEY_FILE), { recursive: true });
    fs.appendFileSync(SURVEY_FILE, JSON.stringify(resp) + "\n", "utf-8");
  } catch (err) {
    console.warn("[store] survey append skipped:", err);
  }
}

// ── 사용자 ──
export function getUser(userId: string): UserProfile | null {
  return getStore().users.get(userId) ?? null;
}

export function getDemoUserId(): string {
  return sampleUser.id;
}

// ── 포인트 원장 ──
export function getBalance(userId: string): number {
  return getStore()
    .ledger.filter((e) => e.userId === userId)
    .reduce((acc, e) => acc + e.amount, 0);
}

export function getLedger(userId: string, limit = 30): LedgerEntry[] {
  return getStore()
    .ledger.filter((e) => e.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function appendLedger(entry: Omit<LedgerEntry, "id" | "immutable" | "createdAt"> & {
  createdAt?: string;
}): LedgerEntry {
  const full: LedgerEntry = {
    ...entry,
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    immutable: true,
  };
  getStore().ledger.push(full);
  return full;
}

// ── 설문 (MVP 개선 의견) ──
export function addSurveyResponse(
  resp: Omit<SurveyResponse, "id" | "createdAt">,
): SurveyResponse {
  const full: SurveyResponse = {
    ...resp,
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  getStore().surveys.unshift(full);
  appendSurveyToDisk(full);
  return full;
}

export function listSurveyResponses(limit = 50): SurveyResponse[] {
  return getStore().surveys.slice(0, limit);
}

export interface SurveyStats {
  total: number;
  npsAvg: number | null;
  npsScore: number | null; // Net Promoter Score = (promoter% - detractor%) ∈ [-100, 100]
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  satisfactionAvg: number | null;
  screenScores: {
    welfare: { avg: number | null; respondents: number };
    jobs: { avg: number | null; respondents: number };
    activity: { avg: number | null; respondents: number };
    community: { avg: number | null; respondents: number };
  };
  painPointCounts: Record<SurveyPainPoint, number>;
  ageBandCounts: Record<SurveyAgeBand, number>;
  usagePeriodCounts: Record<SurveyUsagePeriod, number>;
  recentFeedback: {
    id: string;
    createdAt: string;
    freeFeedback: string;
    painPointDetail: string;
  }[];
}

const PAIN_POINTS: SurveyPainPoint[] = [
  "font_small",
  "slow_loading",
  "button_layout",
  "guide_unclear",
  "accuracy",
  "voice_needed",
  "other",
];
const AGE_BANDS: SurveyAgeBand[] = [
  "60-64",
  "65-69",
  "70-74",
  "75-79",
  "80+",
  "prefer_not",
];
const USAGE_PERIODS: SurveyUsagePeriod[] = [
  "first",
  "days",
  "weeks",
  "month_plus",
];

function avgOrNull(nums: unknown[]): number | null {
  const valid = nums.filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

export function computeSurveyStats(): SurveyStats {
  const all = getStore().surveys;
  const total = all.length;

  const npsValues = all.map((r) => r.nps);
  const satValues = all.map((r) => r.overallSatisfaction);
  const promoters = all.filter((r) => r.nps >= 9).length;
  const passives = all.filter((r) => r.nps >= 7 && r.nps <= 8).length;
  const detractors = all.filter((r) => r.nps <= 6).length;
  const npsScore =
    total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : null;

  const screenAvg = (key: "scoreWelfare" | "scoreJobs" | "scoreActivity" | "scoreCommunity") => {
    const used = all
      .map((r) => r[key])
      .filter((v): v is number => typeof v === "number");
    return { avg: avgOrNull(used), respondents: used.length };
  };

  const painPointCounts = Object.fromEntries(
    PAIN_POINTS.map((p) => [p, 0]),
  ) as Record<SurveyPainPoint, number>;
  for (const r of all) {
    const pp = Array.isArray(r.painPoints) ? r.painPoints : [];
    for (const p of pp) {
      if (p in painPointCounts) painPointCounts[p]++;
    }
  }

  const ageBandCounts = Object.fromEntries(
    AGE_BANDS.map((a) => [a, 0]),
  ) as Record<SurveyAgeBand, number>;
  for (const r of all) {
    if (r.ageBand in ageBandCounts) ageBandCounts[r.ageBand]++;
  }

  const usagePeriodCounts = Object.fromEntries(
    USAGE_PERIODS.map((u) => [u, 0]),
  ) as Record<SurveyUsagePeriod, number>;
  for (const r of all) {
    if (r.usagePeriod in usagePeriodCounts) usagePeriodCounts[r.usagePeriod]++;
  }

  const recentFeedback = all
    .filter((r) => r.freeFeedback.trim() || r.painPointDetail.trim())
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      freeFeedback: r.freeFeedback,
      painPointDetail: r.painPointDetail,
    }));

  return {
    total,
    npsAvg: avgOrNull(npsValues),
    npsScore,
    npsBreakdown: { promoters, passives, detractors },
    satisfactionAvg: avgOrNull(satValues),
    screenScores: {
      welfare: screenAvg("scoreWelfare"),
      jobs: screenAvg("scoreJobs"),
      activity: screenAvg("scoreActivity"),
      community: screenAvg("scoreCommunity"),
    },
    painPointCounts,
    ageBandCounts,
    usagePeriodCounts,
    recentFeedback,
  };
}

// ── 커뮤니티 ──
export function addPoomasiPost(
  post: Omit<PoomasiPost, "id" | "createdAt" | "status" | "helperId" | "reportCount">,
): PoomasiPost {
  const full: PoomasiPost = {
    ...post,
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: "open",
    helperId: null,
    reportCount: 0,
  };
  getStore().poomasi.unshift(full);
  return full;
}
