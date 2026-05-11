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
import GuideVideoButton from "../components/guide-video-button";

const TYPE_LABEL: Record<LedgerType, { ko: string; icon: string }> = {
  GAME: { ko: "인지 게임", icon: "🧩" },
  LEARN: { ko: "학습 퀴즈", icon: "💡" },
  WALK: { ko: "걷기", icon: "🚶" },
  STAMP: { ko: "스탬프", icon: "📍" },
  CULTURE: { ko: "문화 활동", icon: "🎭" },
  EVENT: { ko: "이벤트", icon: "🎪" },
  WELFARE: { ko: "혜택 신청", icon: "📋" },
  JOB: { ko: "일자리", icon: "💼" },
  POOMASI: { ko: "커뮤니티", icon: "💬" },
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
    { label: "활동", icon: "🎯", href: "/activity", active: true },
    { label: "커뮤니티", icon: "💬", href: "/community" },
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-muted)]">
              청바지 · 청춘은 바로 지금
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
              오늘도 <span className="text-[var(--color-primary)]">청춘</span>이세요
            </h1>
          </div>
          <GuideVideoButton src="activity" label="활동" />
        </div>
      </header>

      {/* 포인트 카드 — 활동 섹션 정체성 (부드러운 오렌지) */}
      <section className="hero-warm mx-5 mb-4 rounded-2xl p-5">
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

      {/* 이번 주 적립 가능 — 미션별 한도 가시화 (AC 데모용) */}
      {(() => {
        // 일일 미션 한도 (lib/store의 적립 룰 기준 추정)
        const MISSIONS = [
          { icon: "🧩", label: "인지 게임", daily: 20, days: 7 },
          { icon: "💡", label: "학습 퀴즈", daily: 20, days: 7 },
          { icon: "✍️", label: "한글 미션", daily: 15, days: 7 },
          { icon: "🚶", label: "걷기 (5천보)", daily: 30, days: 7 },
          { icon: "📍", label: "동네 스탬프", daily: 10, days: 5 },
        ];
        const weeklyTotal = MISSIONS.reduce((s, m) => s + m.daily * m.days, 0);
        // 이번 주 이미 적립한 포인트 (월요일 00:00부터)
        const monday = new Date();
        monday.setHours(0, 0, 0, 0);
        const dow = (monday.getDay() + 6) % 7;
        monday.setDate(monday.getDate() - dow);
        const earnedThisWeek = all
          .filter((e) => e.amount > 0 && new Date(e.createdAt) >= monday)
          .reduce((s, e) => s + e.amount, 0);
        const remaining = Math.max(0, weeklyTotal - earnedThisWeek);
        const earnedPct = Math.min(
          100,
          Math.round((earnedThisWeek / weeklyTotal) * 100),
        );
        return (
          <section className="mx-5 mb-6 rounded-2xl border-2 border-[var(--color-warm)]/30 bg-white p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[16px] font-bold text-[var(--color-text)]">
                🎯 이번 주 적립 가능
              </h2>
              <span className="text-[12px] text-[var(--color-muted)]">
                월~일 기준
              </span>
            </div>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-[28px] font-extrabold text-[var(--color-warm)]">
                +{remaining}P
              </span>
              <span className="text-[13px] text-[var(--color-muted)]">
                (전체 {weeklyTotal}P 중 {earnedThisWeek}P 적립됨)
              </span>
            </div>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full bg-[var(--color-warm)] transition-all"
                style={{ width: `${earnedPct}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {MISSIONS.map((m) => (
                <li
                  key={m.label}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <span aria-hidden>{m.icon}</span>
                    <span>{m.label}</span>
                    <span className="text-[var(--color-muted)]">
                      · 일 +{m.daily}P × {m.days}일
                    </span>
                  </span>
                  <span className="font-bold text-[var(--color-warm)]">
                    +{m.daily * m.days}P
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-[var(--bg-soft-orange)] p-3 text-[12px] leading-relaxed text-[var(--color-text)]">
              💡 1,000P 모이면 문화상품권 등으로 교환 가능해요.
              {remaining > 0 && remaining < 1000 - balance % 1000 && (
                <> 이번 주만 다 채우셔도 다음 교환에 가까워집니다.</>
              )}
            </p>
          </section>
        );
      })()}

      {/* 🌳 오늘의 0원 나들이 — AC 추천 핵심 진입점 */}
      <section className="mx-5 mb-3">
        <Link
          href="/activity/outings"
          className="card-link card-soft block overflow-hidden rounded-2xl bg-white"
        >
          <div className="hero-warm p-5 text-white">
            <p className="text-[13px] font-medium text-white/85">
              🚇 지하철 무료 + 무료 입장
            </p>
            <h2 className="mt-1 text-[22px] font-extrabold leading-tight">
              오늘의 0원 나들이
            </h2>
            <p
              className="mt-2 text-[14px] leading-relaxed text-white/90"
              style={{ wordBreak: "keep-all" }}
            >
              교통카드만 있으면 0원으로 다녀올 수 있는 코스를 추천해드려요.
              방문 인증하면 포인트도 받으실 수 있어요.
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="rounded-full bg-white/25 px-3 py-1 text-[12px] font-bold">
                💸 0원
              </span>
              <span className="rounded-full bg-white/25 px-3 py-1 text-[12px] font-bold">
                +최대 1,000P
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white px-5 py-3">
            <span className="text-[14px] font-semibold text-[var(--color-warm-strong)]">
              추천 코스 보러가기
            </span>
            <span className="text-[18px] text-[var(--color-warm-strong)]">→</span>
          </div>
        </Link>
      </section>

      {/* 🎬 문화누리카드로 즐기기 + 🪪 교통카드 발급 — 2칼럼 진입 */}
      <section className="mx-5 mb-6 grid grid-cols-2 gap-2">
        <Link
          href="/activity/culture"
          className="card-link rounded-2xl border-2 border-[var(--color-warm)]/30 bg-white p-4"
        >
          <div className="text-2xl" aria-hidden>🎬</div>
          <p className="mt-1 text-[14px] font-bold text-[var(--color-text)]">
            문화누리카드로 즐기기
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-muted)]">
            영화·공연·전시·여행
          </p>
        </Link>
        <Link
          href="/activity/transport-card"
          className="card-link rounded-2xl border-2 border-[var(--color-warm)]/30 bg-white p-4"
        >
          <div className="text-2xl" aria-hidden>🪪</div>
          <p className="mt-1 text-[14px] font-bold text-[var(--color-text)]">
            경로우대 교통카드
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-muted)]">
            발급 안내·체크리스트
          </p>
        </Link>
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
