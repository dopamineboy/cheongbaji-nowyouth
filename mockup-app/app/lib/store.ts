// 인메모리 데이터 스토어 (MVP S1).
// S2에서 PostgreSQL/Supabase로 갈아끼움 — 인터페이스만 유지하면 호환.
//
// ⚠ Next.js dev/prod 인스턴스 간 메모리 공유 안 됨.
// 데모/시연 목적 한정. 사용자 생성 데이터는 새로고침 시 유실 가능.

import { samplePoomasiPosts, sampleUser } from "./sample-data";
import { realSampleJobs } from "./sample-jobs-real";
import type { Job, LedgerEntry, PoomasiPost, UserProfile } from "./types";

interface Store {
  users: Map<string, UserProfile>;
  jobs: Job[];
  poomasi: PoomasiPost[];
  ledger: LedgerEntry[];
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
  }
  return globalThis.__cheongbajiStore;
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
