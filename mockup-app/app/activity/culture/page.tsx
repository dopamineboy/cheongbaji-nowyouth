// 문화누리카드 연계 활동 — 복지↔활동 브릿지
// AC §활동 강화 기능 5
import Link from "next/link";
import { getCultureByCategory } from "../../lib/outings/culture";
import { getCurrentUser } from "../../lib/current-user";
import { loadAllBenefits } from "../../lib/welfare/content";
import { matchBenefits } from "../../lib/welfare/matcher";
import { toWelfareProfile } from "../../lib/welfare/adapter";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; sub: string }
> = {
  영화: { label: "영화", emoji: "🎬", sub: "시니어 할인 영화관 추천" },
  공연: { label: "공연", emoji: "🎭", sub: "오케스트라·뮤지컬·연극" },
  전시: { label: "전시", emoji: "🎨", sub: "박물관·미술관 특별전" },
  국내여행: { label: "국내여행", emoji: "🗺", sub: "KTX 경로 할인 + 추천 코스" },
  도서: { label: "도서", emoji: "📚", sub: "도서관·서점" },
  체육: { label: "체육", emoji: "🏊", sub: "수영장·헬스장·게이트볼" },
};

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity", active: true },
    { label: "커뮤니티", icon: "💬", href: "/community" },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 z-30 border-t border-[var(--color-border)] bg-white">
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

export default async function CultureVoucherPage() {
  const user = await getCurrentUser();
  const byCategory = getCultureByCategory();

  // 사용자가 문화누리카드 대상자(기초생활수급자/차상위계층)인지 매칭으로 추정
  const benefits = loadAllBenefits();
  const matched = user
    ? matchBenefits(toWelfareProfile(user), benefits)
    : [];
  const cultureCardMatch = matched.find(
    (m) => m.benefit.id === "culture-voucher",
  );
  const isLikelyEligible =
    cultureCardMatch &&
    (cultureCardMatch.status === "eligible" ||
      cultureCardMatch.status === "likely_eligible");

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/activity"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-warm-strong)]"
        >
          ← 활동으로
        </Link>
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          문화누리카드로 <span className="text-[var(--color-warm-strong)]">즐기기</span>
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          영화·공연·전시·여행·도서·체육 — 본인 부담을 줄여드려요
        </p>
      </header>

      {/* 카드 자격 안내 */}
      {isLikelyEligible ? (
        <section className="hero-warm mx-5 mb-5 rounded-2xl p-5 text-white">
          <p className="text-[13px] font-medium text-white/85">📌 입력 정보 기준</p>
          <h2 className="mt-1 text-[20px] font-extrabold leading-tight">
            문화누리카드를 받으실 수 있어요
          </h2>
          <p
            className="mt-2 text-[13px] leading-relaxed text-white/90"
            style={{ wordBreak: "keep-all" }}
          >
            연 13만원이 카드에 충전돼서 영화·공연·전시·여행 등에 사용하실 수 있어요.
          </p>
          <Link
            href="/welfare/culture-voucher"
            className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-[14px] font-bold text-[var(--color-warm-strong)]"
          >
            신청 방법 보기 →
          </Link>
        </section>
      ) : (
        <section className="mx-5 mb-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-[13px] font-medium text-[var(--color-muted)]">
            💳 문화누리카드란?
          </p>
          <h2 className="mt-1 text-[18px] font-bold text-[var(--color-text)]">
            연 13만원 충전 · 영화·공연·전시·여행에 사용
          </h2>
          <p
            className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]"
            style={{ wordBreak: "keep-all" }}
          >
            기초생활수급자·차상위계층 만 6세 이상이 대상이에요.
            아래 활동들은 카드 없이도 시니어 할인으로 즐기실 수 있는 항목 위주로 정리했어요.
          </p>
          <Link
            href="/welfare/culture-voucher"
            className="mt-3 inline-block rounded-full bg-[var(--color-warm)]/10 px-4 py-2 text-[14px] font-bold text-[var(--color-warm-strong)]"
          >
            카드 자격·신청 방법 보기 →
          </Link>
        </section>
      )}

      {/* 카테고리별 활동 */}
      {Array.from(byCategory.entries()).map(([cat, activities]) => {
        const meta = CATEGORY_META[cat] ?? {
          label: cat,
          emoji: "✨",
          sub: "",
        };
        return (
          <section key={cat} className="mb-6 px-5">
            <div className="mb-3">
              <h2 className="text-[19px] font-bold text-[var(--color-text)]">
                {meta.emoji} {meta.label} ({activities.length})
              </h2>
              <p className="text-[12px] text-[var(--color-muted)]">{meta.sub}</p>
            </div>
            <div className="flex flex-col gap-3">
              {activities.map((a) => (
                <article
                  key={a.id}
                  className="card-soft rounded-2xl bg-white p-5"
                >
                  <h3 className="text-[16px] font-bold leading-tight text-[var(--color-text)]">
                    {a.emoji} {a.title}
                  </h3>
                  <p
                    className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]"
                    style={{ wordBreak: "keep-all" }}
                  >
                    {a.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-success)]">
                      💸 {a.estimatedCost}
                    </span>
                    {a.seniorDiscount && (
                      <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                        👴 {a.seniorDiscount}
                      </span>
                    )}
                    <span className="rounded-full bg-[var(--color-warm)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-warm-strong)]">
                      💳 {a.cardUsage}
                    </span>
                  </div>
                  {a.tip && (
                    <p className="mt-3 rounded-lg bg-[var(--bg-soft-yellow)] p-2.5 text-[12px] leading-snug text-[var(--color-text)]">
                      💡 {a.tip}
                    </p>
                  )}
                  {a.bookingUrl && (
                    <a
                      href={a.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block rounded-xl bg-[var(--color-warm)]/10 py-2.5 text-center text-[13px] font-bold text-[var(--color-warm-strong)]"
                    >
                      {a.partnerName ?? "공식 사이트"} 바로가기 →
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* 안내 */}
      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        ※ 시니어 할인 정책과 가격은 시설별로 변경될 수 있어요.
        문화누리카드 사용처는 공식 사이트(www.mnuri.kr)에서 가장 정확한 정보를 확인하실 수 있습니다.
      </p>

      <TabBar />
    </main>
  );
}
