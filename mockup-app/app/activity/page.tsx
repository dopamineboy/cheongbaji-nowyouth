// ② 활동 리워드 — 포인트 잔액·주간 차트·게임 허브·배지·이력
import Link from "next/link";
import { getBalance, getLedger } from "../lib/store";
import { getCurrentUser } from "../lib/current-user";
import { computeBadges } from "../lib/badges";
import GameMission from "./game-mission";
import HangulMission from "./hangul-mission";
import QuizMission from "./quiz-mission";
import WeeklyChart from "./weekly-chart";
import type { LedgerEntry, LedgerType } from "../lib/types";

const TYPE_LABEL: Record<LedgerType, { ko: string; icon: string }> = {
  GAME: { ko: "인지 게임", icon: "🧩" },
  LEARN: { ko: "학습 퀴즈", icon: "💡" },
  WALK: { ko: "걷기", icon: "🚶" },
  STAMP: { ko: "스탬프", icon: "📍" },
  CULTURE: { ko: "문화 활동", icon: "🎭" },
  EVENT: { ko: "이벤트", icon: "🎪" },
  WELFARE: { ko: "혜택 신청", icon: "📋" },
  JOB: { ko: "일자리", icon: "💼" },
  POOMASI: { ko: "품앗이", icon: "💬" },
  REDEEM: { ko: "리워드 교환", icon: "🎁" },
  ADMIN_ADJUST: { ko: "조정", icon: "⚙️" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

function LedgerRow({ e }: { e: LedgerEntry }) {
  const label = TYPE_LABEL[e.type] ?? { ko: e.type, icon: "•" };
  return (
    <li className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>{label.icon}</span>
        <div>
          <p className="text-[15px] font-semibold text-[var(--color-text)]">{label.ko}</p>
          <p className="text-[13px] text-[var(--color-muted)]">{timeAgo(e.createdAt)}</p>
        </div>
      </div>
      <span
        className={`text-[15px] font-bold ${
          e.amount >= 0 ? "text-[var(--color-primary)]" : "text-[var(--color-urgent)]"
        }`}
      >
        {e.amount >= 0 ? "+" : ""}
        {e.amount}P
      </span>
    </li>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "품앗이", icon: "💬", href: "/community" },
    { label: "포인트", icon: "🎯", href: "/activity", active: true },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 border-t border-[var(--color-border)] bg-white">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-[13px] font-medium ${
                t.active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
              }`}
            >
              <span className="text-2xl" aria-hidden>{t.icon}</span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await getCurrentUser();
  const balance = user ? getBalance(user.id) : 0;
  const recent = user ? getLedger(user.id, 12) : [];
  const all = user ? getLedger(user.id, 1000) : [];
  const badges = computeBadges(all);
  const earnedBadges = badges.filter((b) => b.earned);

  const nextStep = Math.ceil((balance + 1) / 1000) * 1000;
  const progressPct = Math.min(100, Math.round(((balance % 1000) / 1000) * 100));

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
          오늘도 <span className="text-[var(--color-primary)]">청춘</span>이세요
        </h1>
      </header>

      {/* 포인트 카드 */}
      <section className="hero-blue mx-5 mb-4 rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-medium text-white/80">내 포인트</p>
          <Link
            href="/rewards"
            className="rounded-full bg-white/20 px-4 py-1.5 text-[14px] font-semibold"
          >
            교환하기 →
          </Link>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[40px] font-extrabold leading-tight">
            {balance.toLocaleString()}
          </span>
          <span className="text-[18px] font-medium">P</span>
        </div>
        <div className="mt-3">
          <p className="mb-2 text-[14px] text-white/70">
            다음 교환({nextStep.toLocaleString()}P)까지 {(nextStep - balance).toLocaleString()}P 남음
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* 주간 차트 */}
      <section className="mx-5 mb-6">
        <WeeklyChart ledger={all} />
      </section>

      {/* 배지 */}
      <section className="mx-5 mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[19px] font-bold text-[var(--color-text)]">성취 배지</h2>
          <span className="text-[13px] text-[var(--color-muted)]">
            {earnedBadges.length}/{badges.length} 획득
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl p-3 text-center ${
                b.earned
                  ? "bg-[var(--color-accent)]/15"
                  : "bg-white border border-[var(--color-border)] opacity-50"
              }`}
              title={b.description}
            >
              <div className="text-3xl" aria-hidden>{b.icon}</div>
              <p className="mt-1 text-[12px] font-bold leading-tight text-[var(--color-text)]">
                {b.name}
              </p>
              {b.progress && !b.earned && (
                <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                  {b.progress.current}/{b.progress.target}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 게임 허브 */}
      <section className="px-5">
        <h2 className="mb-3 text-[19px] font-bold text-[var(--color-text)]">
          오늘의 미션
        </h2>
        <div className="flex flex-col gap-3">
          <GameMission />
          <HangulMission />
          <QuizMission />
        </div>
      </section>

      {/* 적립 내역 */}
      <section className="mx-5 mt-6">
        <h2 className="mb-3 text-[19px] font-bold text-[var(--color-text)]">
          최근 적립 내역
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-center text-[15px] text-[var(--color-muted)]">
            아직 활동 내역이 없어요. 미션을 시작해보세요!
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <LedgerRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </section>

      <TabBar />
    </main>
  );
}
