// 청바지 통합 홈 피드 — 4대 통합서비스 믹스
// 4대통합서비스_구현계획서 §7 홈 피드 믹스 전략 적용
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getBalance,
  getStore,
} from "./lib/store";
import { matchJobsForUser } from "./lib/jobs/match";
import { ensureJobsLoaded } from "./lib/jobs/ingestion/pipeline";
import { loadAllBenefits } from "./lib/welfare/content";
import {
  matchBenefits,
  totalEligibleAmount,
} from "./lib/welfare/matcher";
import { toWelfareProfile } from "./lib/welfare/adapter";
import { isOnboarded } from "./lib/auth";
import { getCurrentUser } from "./lib/current-user";
import RestartButton from "./components/restart-button";

export const dynamic = "force-dynamic";

function GreetingHeader({ name, dong }: { name: string; dong: string }) {
  return (
    <header className="flex items-start justify-between px-5 pt-6 pb-4">
      <div>
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
          안녕하세요, <span className="text-[var(--color-primary)]">{name}</span>님
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">{dong}</p>
      </div>
      <RestartButton />
    </header>
  );
}

function MatchingHero({
  name,
  totalCount,
  welfareCount,
  welfareMonthlyKrw,
  jobCount,
  jobTopWage,
  poomasiCount,
  balance,
}: {
  name: string;
  totalCount: number;
  welfareCount: number;
  welfareMonthlyKrw: number;
  jobCount: number;
  jobTopWage: number;
  poomasiCount: number;
  balance: number;
}) {
  return (
    <section className="hero-blue mx-5 mb-4 rounded-2xl p-5 text-white">
      <p className="text-[13px] font-medium text-white/85">
        🤖 AI 매칭 결과 · 입력하신 조건 기준
      </p>
      <h2 className="mt-1 text-[22px] font-extrabold leading-tight">
        {name}님이 확인해볼
        <br />
        혜택{" "}
        <span className="text-[28px] text-[var(--color-accent-soft)]">
          {totalCount}건
        </span>
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/welfare"
          className="rounded-xl bg-white/15 px-3 py-3 transition hover:bg-white/25"
        >
          <p className="text-[12px] font-medium text-white/80">📋 복지</p>
          <p className="mt-0.5 text-[18px] font-extrabold">{welfareCount}건</p>
          {welfareMonthlyKrw > 0 && (
            <p className="text-[11px] leading-tight text-white/75">
              최대 월 {(welfareMonthlyKrw / 10000).toFixed(0)}만원 가능성
            </p>
          )}
        </Link>
        <Link
          href="/jobs"
          className="rounded-xl bg-white/15 px-3 py-3 transition hover:bg-white/25"
        >
          <p className="text-[12px] font-medium text-white/80">💼 일자리</p>
          <p className="mt-0.5 text-[18px] font-extrabold">{jobCount}건</p>
          {jobTopWage > 0 && (
            <p className="text-[11px] leading-tight text-white/75">
              시급 최대 {jobTopWage.toLocaleString()}원
            </p>
          )}
        </Link>
        <Link
          href="/activity"
          className="rounded-xl bg-white/15 px-3 py-3 transition hover:bg-white/25"
        >
          <p className="text-[12px] font-medium text-white/80">🎯 활동</p>
          <p className="mt-0.5 text-[18px] font-extrabold">
            {balance.toLocaleString()}P
          </p>
          <p className="text-[11px] leading-tight text-white/75">
            적립 포인트
          </p>
        </Link>
        <Link
          href="/community"
          className="rounded-xl bg-white/15 px-3 py-3 transition hover:bg-white/25"
        >
          <p className="text-[12px] font-medium text-white/80">💬 커뮤니티</p>
          <p className="mt-0.5 text-[18px] font-extrabold">{poomasiCount}건</p>
          <p className="text-[11px] leading-tight text-white/75">우리 동 요청</p>
        </Link>
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-white/65">
        * 룰 기반 매칭 + AI Ranker · 정부24·복지로 공식 자료 기반 추정
      </p>
    </section>
  );
}

function QuickGrid() {
  const items = [
    { label: "복지 알리미", icon: "📋", href: "/welfare", cls: "hero-blue" },
    { label: "일자리", icon: "💼", href: "/jobs", cls: "hero-gold" },
    { label: "활동", icon: "🎯", href: "/activity", cls: "hero-warm" },
    { label: "커뮤니티", icon: "💬", href: "/community", cls: "hero-emerald" },
  ];
  return (
    <section className="mx-5 mb-5 grid grid-cols-2 gap-3">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className={`card-link flex items-center gap-3 rounded-2xl ${it.cls} p-4`}
        >
          <span className="text-3xl" aria-hidden>
            {it.icon}
          </span>
          <span className="text-[16px] font-bold leading-tight">{it.label}</span>
        </Link>
      ))}
    </section>
  );
}

function FeedCard({
  badge,
  badgeColor,
  title,
  body,
  cta,
  href,
}: {
  badge: string;
  badgeColor: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <article className="card-soft card-link rounded-2xl bg-white p-5">
        <span className={`mb-2 inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${badgeColor}`}>
          {badge}
        </span>
        <h3 className="mt-1 text-[18px] font-bold leading-tight text-[var(--color-text)]">{title}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-muted)]">{body}</p>
        <p className="mt-3 text-[15px] font-semibold text-[var(--color-primary)]">{cta} →</p>
      </article>
    </Link>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/", active: true },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity" },
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

export default async function Home() {
  // 게이트: 온보딩(인터뷰) 안 했으면 환영 페이지로 자동 이동
  if (!(await isOnboarded())) {
    redirect("/welcome");
  }

  await ensureJobsLoaded();

  const user = await getCurrentUser();
  if (!user) return null;

  const balance = getBalance(user.id);
  const store = getStore();

  const benefits = loadAllBenefits();
  const welfareMatched = matchBenefits(toWelfareProfile(user), benefits);
  const eligibleWelfare = welfareMatched.filter(
    (m) => m.status === "eligible" || m.status === "likely_eligible",
  );
  const totalWelfareKrw = totalEligibleAmount(welfareMatched);
  const topWelfare = eligibleWelfare[0];

  const jobs = matchJobsForUser(user, store.jobs);
  const topJob = jobs[0];

  const myPoomasi = store.poomasi
    .filter((p) => p.status === "open" && p.dongCode === user.dongCode)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const topPoomasi = myPoomasi[0];

  // 복지 카드의 신청처·서류 표시용 (AC 요구: "신청처 · 필요 정보" 명시)
  const topWelfareApply = topWelfare
    ? topWelfare.benefit.apply.online?.name ??
      topWelfare.benefit.apply.offline?.[0] ??
      "주소지 행정복지센터"
    : "";
  const topWelfareDocs =
    topWelfare?.benefit.documents?.slice(0, 2).join(" · ") ?? "";
  const topWelfareAmount =
    topWelfare?.benefit.benefit.amount_krw_max?.single ??
    topWelfare?.benefit.benefit.amount_krw_max?.couple ??
    0;

  const totalCount = eligibleWelfare.length + jobs.length + myPoomasi.length;
  const jobTopWage = topJob?.wageKrwPerHour ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <GreetingHeader name={user.name} dong={user.dongName} />
      <MatchingHero
        name={user.name}
        totalCount={totalCount}
        welfareCount={eligibleWelfare.length}
        welfareMonthlyKrw={totalWelfareKrw}
        jobCount={jobs.length}
        jobTopWage={jobTopWage}
        poomasiCount={myPoomasi.length}
        balance={balance}
      />
      <QuickGrid />

      {/* 통합 피드 — 4대 서비스 믹스 */}
      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-[19px] font-bold text-[var(--color-text)]">오늘의 추천</h2>

        {topWelfare && (
          <Link href="/welfare">
            <article className="card-soft card-link rounded-2xl bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[13px] font-semibold text-[var(--color-primary)]">
                  📋 복지
                </span>
                {topWelfare.status === "eligible" && (
                  <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-success)]">
                    ✓ 가능성 높음
                  </span>
                )}
                {topWelfare.status === "likely_eligible" && (
                  <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[12px] font-bold text-[#8A5E00]">
                    가능성 있음
                  </span>
                )}
              </div>
              <h3 className="text-[18px] font-bold leading-tight text-[var(--color-text)]">
                {topWelfare.benefit.name}
              </h3>
              {topWelfareAmount > 0 && (
                <p className="mt-1 text-[15px] font-bold text-[var(--color-primary)]">
                  예상 월 최대 {topWelfareAmount.toLocaleString()}원
                </p>
              )}
              {topWelfareDocs && (
                <p className="mt-2 text-[13px] leading-snug text-[var(--color-muted)]">
                  <span className="font-semibold text-[var(--color-text)]">필요 정보:</span>{" "}
                  {topWelfareDocs}
                </p>
              )}
              <p className="mt-1 text-[13px] leading-snug text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-text)]">신청처:</span>{" "}
                {topWelfareApply}
              </p>
              <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">
                받으실 수 있는 혜택 {eligibleWelfare.length}건 모두 보기 →
              </p>
            </article>
          </Link>
        )}

        {topJob && (
          <Link href="/jobs">
            <article className="card-soft card-link rounded-2xl bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
                  💼 일자리 · {topJob.activityType}
                </span>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-primary)]">
                  적합도 {topJob.score}점
                </span>
              </div>
              <h3 className="text-[18px] font-bold leading-tight text-[var(--color-text)]">
                {topJob.title}
              </h3>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">{topJob.org}</p>
              <p className="mt-2 text-[14px] leading-snug text-[var(--color-text)]">
                ✨ {topJob.matchReason}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-lg bg-[var(--bg-page)] px-3 py-2">
                  <p className="text-[11px] text-[var(--color-muted)]">시급</p>
                  <p className="font-bold text-[var(--color-primary)]">
                    {topJob.wageKrwPerHour.toLocaleString()}원
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--bg-page)] px-3 py-2">
                  <p className="text-[11px] text-[var(--color-muted)]">거리</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {topJob.distanceKm < 1
                      ? `${(topJob.distanceKm * 1000).toFixed(0)}m`
                      : `${topJob.distanceKm.toFixed(1)}km`}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">
                추천 일자리 {jobs.length}건 모두 보기 →
              </p>
            </article>
          </Link>
        )}

        <FeedCard
          badge="🎯 오늘의 도전"
          badgeColor="bg-[var(--color-urgent)]/10 text-[var(--color-urgent)]"
          title="인지 훈련 게임 한 판"
          body="숫자 기억 게임을 완료하면 20포인트가 적립돼요."
          cta="시작하기 (+20P)"
          href="/activity"
        />

        {topPoomasi && (
          <FeedCard
            badge="💬 우리 동 커뮤니티"
            badgeColor="bg-[var(--color-success)]/10 text-[var(--color-success)]"
            title={topPoomasi.title}
            body={topPoomasi.body}
            cta={`${myPoomasi.length}건 요청 중 · 도움 시 +100P`}
            href="/community"
          />
        )}
      </section>

      <TabBar />
    </main>
  );
}
