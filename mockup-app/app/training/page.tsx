// 정부 지원 교육 전체 목록 — 사용자 관심 분야 기준 정렬
import Link from "next/link";
import {
  TRAINING_COURSES,
  supportLabel,
  type TrainingCategory,
} from "../lib/training/courses";
import { recommendedTrainings } from "../lib/training/match";
import { getCurrentUser } from "../lib/current-user";
import ApplyGuideModal from "./apply-guide-modal";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<TrainingCategory, { ko: string; icon: string }> = {
  디지털: { ko: "디지털·AI", icon: "📱" },
  돌봄: { ko: "돌봄·복지", icon: "🤲" },
  자격증: { ko: "자격증", icon: "📜" },
  보육교육: { ko: "보육·교육", icon: "👶" },
  공방: { ko: "공방·수공예", icon: "🎨" },
  환경문화: { ko: "환경·문화", icon: "🌳" },
  외식: { ko: "외식·주방", icon: "🍳" },
  응대: { ko: "응대·서비스", icon: "💬" },
};

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs", active: true },
    { label: "활동", icon: "🎯", href: "/activity" },
    { label: "커뮤니티", icon: "💬", href: "/community" },
    { label: "설문", icon: "📝", href: "/survey" },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 z-30 border-t border-[var(--color-border)] bg-white">
      <ul className="grid grid-cols-6">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-[12px] font-medium ${
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

export default async function TrainingPage() {
  const user = await getCurrentUser();
  const recommended = recommendedTrainings(
    user?.jobPreferences?.preferredJobTypes ?? [],
    user?.jobPreferences?.pastOccupations ?? [],
    6,
  );

  const byCategory = new Map<TrainingCategory, typeof TRAINING_COURSES>();
  for (const c of TRAINING_COURSES) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category)!.push(c);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          무료 <span className="text-[var(--color-primary)]">연계 교육</span>
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          국민내일배움카드·평생교육바우처·디지털배움터 등 본인부담 0원 또는 소액 과정
        </p>
      </header>

      {/* 섹션 토글: 일자리 매칭 ↔ 무료 연계 교육 */}
      <nav className="mx-5 mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--color-border)] bg-white p-1">
        <Link
          href="/jobs"
          className="rounded-xl px-3 py-3 text-center text-[15px] font-bold text-[var(--color-muted)]"
        >
          💼 일자리 매칭
        </Link>
        <Link
          href="/training"
          aria-current="page"
          className="rounded-xl bg-[var(--color-primary)] px-3 py-3 text-center text-[15px] font-bold text-white"
        >
          🎓 무료 연계 교육
        </Link>
      </nav>

      {/* 사용자 추천 */}
      <section className="mx-5 mb-6 rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--bg-soft-blue)] p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          ✨ {user?.name ?? "어르신"}님 맞춤 추천
        </h2>
        <div className="flex flex-col gap-3">
          {recommended.slice(0, 4).map((c) => (
            <article key={c.id} className="rounded-xl bg-white p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-success)]">
                  {c.feeKrw === 0 ? "본인부담 0원" : `${c.feeKrw.toLocaleString()}원`}
                </span>
                <span className="text-[11px] text-[var(--color-muted)]">{c.duration}</span>
              </div>
              <h3 className="text-[14px] font-bold text-[var(--color-text)]">{c.name}</h3>
              <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{c.agency}</p>
              <a
                href={c.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[12px] font-bold text-[var(--color-primary)]"
              >
                신청 →
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* 카테고리별 */}
      {Array.from(byCategory.entries()).map(([cat, courses]) => {
        const meta = CATEGORY_LABEL[cat];
        return (
          <section key={cat} className="mb-6 px-5">
            <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
              {meta.icon} {meta.ko} ({courses.length})
            </h2>
            <div className="flex flex-col gap-3">
              {courses.map((c) => (
                <article
                  key={c.id}
                  className="card-soft rounded-2xl bg-white p-5"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-success)]">
                      {c.feeKrw === 0 ? "본인부담 0원" : `${c.feeKrw.toLocaleString()}원`}
                    </span>
                    <span className="text-[12px] text-[var(--color-muted)]">
                      {c.duration}
                    </span>
                    <span className="text-[12px] text-[var(--color-muted)]">·</span>
                    <span className="text-[12px] text-[var(--color-muted)]">
                      {c.region}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold leading-tight text-[var(--color-text)]">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-[12px] text-[var(--color-muted)]">{c.agency}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text)]">
                    {c.description}
                  </p>
                  <div className="mt-3 rounded-lg bg-[var(--bg-soft-yellow)] p-2">
                    <p className="text-[11px] font-semibold text-[#8A5E00]">
                      💰 적용 가능: {c.supports.map(supportLabel).join(" / ")}
                    </p>
                  </div>
                  {/* 신청 방법 자세히 보기 — 시니어 친화 단계별 안내 모달 */}
                  <ApplyGuideModal course={c} />
                  <a
                    href={c.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block w-full rounded-xl bg-[var(--color-primary)]/10 py-2.5 text-center text-[13px] font-bold text-[var(--color-primary)]"
                  >
                    바로 공식 사이트 열기 →
                  </a>
                  {c.contactPhone && (
                    <p className="mt-2 text-center text-[12px] text-[var(--color-muted)]">
                      문의: {c.contactPhone}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mx-5 mt-2 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
        <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
          <span className="font-bold text-[var(--color-text)]">정부 지원 안내</span>
          <br />
          국민내일배움카드는 5년간 300~500만원, 평생교육바우처는 연 35만원까지 정부에서 지원해드려요.
          만 60세 이상은 대부분의 자격증 응시료가 면제·감면됩니다.
          신청 어려우시면 가까운 고용복지플러스센터(국번없이 ☎ 1350)에 연락하세요.
        </p>
      </section>

      <TabBar />
    </main>
  );
}
