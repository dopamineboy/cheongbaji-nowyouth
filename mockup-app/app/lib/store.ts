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
import {
  SURVEY_CHOICE_KEYS,
  type Job,
  type LedgerEntry,
  type PoomasiPost,
  type SurveyChoice,
  type SurveyChoiceKey,
  type SurveyResponse,
  type UserProfile,
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

/** 객관식 문항 1개의 분포 + 평균 + 기타 텍스트 모음 */
export interface SurveyChoiceStats {
  /** ①·②·③ 각각의 응답 수 */
  counts: { 1: number; 2: number; 3: number };
  /** 평균(1~3) — 응답 없으면 null */
  avg: number | null;
  /** 응답자 수 (해당 문항에 객관식 답한 사람) */
  respondents: number;
  /** 기타 자유 입력 (응답 있는 것만) */
  etcAnswers: string[];
}

export interface SurveyStats {
  total: number;
  choices: Record<SurveyChoiceKey, SurveyChoiceStats>;
  /** Q11~Q13 자유 응답 — 최근 5건 */
  liked: { id: string; createdAt: string; text: string }[];
  disliked: { id: string; createdAt: string; text: string }[];
  oneChange: { id: string; createdAt: string; text: string }[];
}

function avgOrNull(nums: unknown[]): number | null {
  const valid = nums.filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

function readChoice(
  r: SurveyResponse,
  key: SurveyChoiceKey,
): { choice: SurveyChoice; etc?: string } | null {
  const v = (r as unknown as Record<string, unknown>)[key];
  if (!v || typeof v !== "object") return null;
  const obj = v as { choice?: unknown; etc?: unknown };
  if (obj.choice !== 1 && obj.choice !== 2 && obj.choice !== 3) return null;
  return {
    choice: obj.choice,
    etc: typeof obj.etc === "string" ? obj.etc : undefined,
  };
}

function topNTexts(
  all: SurveyResponse[],
  field: "q11_liked" | "q12_disliked" | "q13_oneChange",
  n = 5,
): { id: string; createdAt: string; text: string }[] {
  return all
    .filter((r) => typeof r[field] === "string" && r[field].trim().length > 0)
    .slice(0, n)
    .map((r) => ({ id: r.id, createdAt: r.createdAt, text: r[field] }));
}

export function computeSurveyStats(): SurveyStats {
  const all = getStore().surveys;
  const total = all.length;

  const choices = {} as Record<SurveyChoiceKey, SurveyChoiceStats>;
  for (const key of SURVEY_CHOICE_KEYS) {
    const counts = { 1: 0, 2: 0, 3: 0 };
    const numericChoices: number[] = [];
    const etcAnswers: string[] = [];
    for (const r of all) {
      const a = readChoice(r, key);
      if (!a) continue;
      counts[a.choice]++;
      numericChoices.push(a.choice);
      if (a.etc && a.etc.trim().length > 0) etcAnswers.push(a.etc.trim());
    }
    choices[key] = {
      counts,
      avg: avgOrNull(numericChoices),
      respondents: numericChoices.length,
      etcAnswers,
    };
  }

  return {
    total,
    choices,
    liked: topNTexts(all, "q11_liked"),
    disliked: topNTexts(all, "q12_disliked"),
    oneChange: topNTexts(all, "q13_oneChange"),
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
