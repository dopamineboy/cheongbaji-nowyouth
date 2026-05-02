// ③ 일자리 매칭 페이지 — 3단계 매칭 결과 노출
// 시니어 일자리 매칭 보고서 §5.2 "이유 설명형" 추천 적용

import Link from "next/link";
import type { ScoredJob } from "../lib/jobs/match";
import { matchJobsForUser } from "../lib/jobs/match";
import { ensureJobsLoaded } from "../lib/jobs/ingestion/pipeline";
import { getStore } from "../lib/store";
import { getCurrentUser } from "../lib/current-user";

export const dynamic = "force-dynamic";

function pickedAsLabel(p?: ScoredJob["pickedAs"]): { text: string; color: string } | null {
  if (!p) return null;
  switch (p) {
    case "top":
      return { text: "최고 적합도", color: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" };
    case "career":
      return { text: "경력 활용", color: "bg-[var(--color-success)]/10 text-[var(--color-success)]" };
    case "wage":
      return { text: "임금 우수", color: "bg-[var(--color-accent)]/15 text-[#8A5E00]" };
    case "explore":
      return { text: "새로운 분야", color: "bg-[var(--color-urgent)]/10 text-[var(--color-urgent)]" };
  }
}

function commuteText(km: number): string {
  if (km < 1) return `도보 ${Math.round(km * 20)}분`;
  if (km < 5) return `${km.toFixed(1)}km · 약 ${Math.round(km * 8)}분`;
  return `${km.toFixed(1)}km · 약 ${Math.round(km * 6 + 10)}분`;
}

function JobCard({ j }: { j: ScoredJob }) {
  const picked = pickedAsLabel(j.pickedAs);
  return (
    <Link href={`/jobs/${j.id}`}>
      <article className="card-soft card-link relative overflow-hidden rounded-2xl bg-white">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--color-primary)]" />
        <div className="p-5 pl-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[13px] font-semibold text-[var(--color-primary)]">
              {j.activityType}
            </span>
            {picked && (
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${picked.color}`}>
                {picked.text}
              </span>
            )}
          </div>

          <h3 className="mb-1 text-[20px] font-bold leading-tight text-[var(--color-text)]">
            {j.title}
          </h3>
          <p className="mb-3 text-[14px] text-[var(--color-muted)]">{j.org}</p>

          <div className="mb-3 rounded-xl bg-[var(--bg-page)] p-3">
            <p className="text-[14px] font-semibold text-[var(--color-text)]">
              ✨ {j.matchReason}
            </p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              적합도 {j.score}점 · {commuteText(j.distanceKm)} · {j.schedule.split("(")[0].trim()}
            </p>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-[14px]">
            <div>
              <span className="text-[var(--color-muted)]">시급</span>
              <p className="font-bold text-[var(--color-primary)]">
                {j.wageKrwPerHour.toLocaleString()}원
              </p>
            </div>
            <div>
              <span className="text-[var(--color-muted)]">근무</span>
              <p className="font-bold text-[var(--color-text)]">주 {j.hoursPerWeek}시간</p>
            </div>
          </div>

          <p className="text-center text-[15px] font-semibold text-[var(--color-primary)]">
            자세히 보기 →
          </p>
        </div>
      </article>
    </Link>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs", active: true },
    { label: "품앗이", icon: "💬", href: "/community" },
    { label: "포인트", icon: "🎯", href: "/activity" },
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
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function JobsPage() {
  await ensureJobsLoaded();
  const user = await getCurrentUser();
  const allJobs = getStore().jobs;
  const top5 = user ? matchJobsForUser(user, allJobs) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-muted)]">
              청바지 · 청춘은 바로 지금
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
              나에게 맞는 <span className="text-[var(--color-primary)]">일자리</span>
            </h1>
          </div>
        </div>
      </header>

      <section className="hero-blue mx-5 mb-5 rounded-2xl p-5">
        <p className="text-[15px] font-medium text-white/80">
          {user?.dongName} 기준 추천
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[40px] font-extrabold leading-tight">{top5.length}</span>
          <span className="text-[18px] font-medium">건 추천</span>
        </div>
        <p className="mt-2 text-[14px] text-white/70">
          나이·거주지·경력·시간 기준 100점 적합도 매칭 (워크넷 + 지자체)
        </p>
      </section>

      <section className="flex flex-col gap-4 px-5">
        {top5.map((j) => (
          <JobCard key={j.id} j={j} />
        ))}
        {top5.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-center text-[15px] text-[var(--color-muted)]">
            조건에 맞는 일자리를 찾지 못했어요. 잠시 후 다시 확인해주세요.
          </p>
        )}
      </section>

      <section className="mx-5 mt-6 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
        <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">신청에 도움이 필요하신가요?</span>
          <br />
          품앗이 게시판에서 동행을 요청할 수 있어요. 첫 신청 완료 시 200P 적립.
        </p>
      </section>

      <TabBar />
    </main>
  );
}
