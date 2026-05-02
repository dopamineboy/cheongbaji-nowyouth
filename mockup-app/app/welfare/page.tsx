// ① 복지 알리미 — 도우다 matcher 기반
import Link from "next/link";
import { getCurrentUser } from "../lib/current-user";
import { loadAllBenefits } from "../lib/welfare/content";
import {
  matchBenefits,
  summarizeAmounts,
  type MatchedBenefit,
  type MatchStatus,
} from "../lib/welfare/matcher";
import { toWelfareProfile } from "../lib/welfare/adapter";

const STATUS_META: Record<
  MatchStatus,
  { label: string; color: string; stripe: string; nextAction: string }
> = {
  eligible: {
    label: "바로 신청 가능",
    color: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    stripe: "bg-[var(--color-success)]",
    nextAction: "신청 페이지에서 즉시 신청하실 수 있어요.",
  },
  likely_eligible: {
    label: "주민센터 확인 후 신청",
    color: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    stripe: "bg-[var(--color-primary)]",
    nextAction: "입력 정보로는 자격이 있어 보이나, 정확한 소득인정액·재산환산 검토가 필요해요. 주민센터 문의 권장.",
  },
  needs_more_info: {
    label: "추가 정보 필요",
    color: "bg-[var(--color-accent)]/15 text-[#8A5E00]",
    stripe: "bg-[var(--color-accent)]",
    nextAction: "아래 누락된 정보를 알려주시면 정확히 매칭해드릴게요.",
  },
  ineligible: {
    label: "조건 미부합",
    color: "bg-[var(--color-muted)]/15 text-[var(--color-muted)]",
    stripe: "bg-[var(--color-muted)]",
    nextAction: "현재 입력 정보 기준으로는 받기 어려워요.",
  },
};

const CATEGORY_ICON: Record<string, string> = {
  노후소득보장: "💰",
  "주거·에너지": "🏠",
  "기초생활보장": "🪙",
  "기초생활보장(주거)": "🏠",
  "기초생활보장(의료)": "🏥",
  의료지원: "🏥",
  "건강·돌봄": "🩺",
  돌봄: "🤲",
  문화여가: "🎫",
  "문화·여가": "🎭",
  통신비: "📞",
  교통: "🚌",
  안전: "🛡️",
  복지서비스: "✨",
};

function BenefitCard({ m, receiving }: { m: MatchedBenefit; receiving?: boolean }) {
  const meta = STATUS_META[m.status];
  const icon = CATEGORY_ICON[m.benefit.category] ?? "📌";
  const amount =
    m.benefit.benefit.amount_krw_max?.single ??
    m.benefit.benefit.amount_krw_max?.couple ??
    0;
  const amountText =
    amount === 0
      ? "서비스 제공"
      : m.benefit.benefit.type === "monthly_cash"
      ? `월 최대 ${amount.toLocaleString("ko-KR")}원`
      : m.benefit.benefit.type === "one_time_cash"
      ? `1회 최대 ${amount.toLocaleString("ko-KR")}원`
      : `최대 ${amount.toLocaleString("ko-KR")}원`;

  return (
    <Link href={`/welfare/${m.benefit.id}`}>
      <article className="card-soft card-link relative overflow-hidden rounded-2xl bg-white">
        <div
          className={`absolute left-0 top-0 h-full w-1.5 ${
            receiving ? "bg-[var(--color-success)]" : meta.stripe
          }`}
        />
        <div className="p-5 pl-6">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                receiving
                  ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                  : meta.color
              }`}
            >
              {receiving ? "수령 중" : meta.label}
            </span>
            {!receiving && (
              <span className="text-[12px] text-[var(--color-muted)]">
                부합률 {m.matchPct}%
              </span>
            )}
          </div>

          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {icon}
            </span>
            <h3 className="text-[20px] font-bold leading-tight text-[var(--color-text)]">
              {m.benefit.name}
            </h3>
          </div>

          <p className="mb-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
            {m.benefit.summary.split("\n").slice(0, 2).join(" ")}
          </p>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold text-[var(--color-primary)]">
              {amountText}
            </span>
          </div>

          {m.reasons.length > 0 && (
            <div className="rounded-xl bg-[var(--bg-page)] p-3">
              <p className="text-[13px] font-semibold text-[var(--color-text)]">
                ✓ {m.reasons[0]}
              </p>
              {m.missing.length > 0 && (
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                  • 추가로 알려주시면 좋아요: {m.missing.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-[15px] font-semibold text-[var(--color-primary)]">
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
    { label: "복지", icon: "📋", href: "/welfare", active: true },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "포인트", icon: "🎯", href: "/activity" },
    { label: "품앗이", icon: "💬", href: "/community" },
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

export const dynamic = "force-dynamic";

export default async function WelfarePage() {
  const user = await getCurrentUser();
  const benefits = loadAllBenefits();
  const matched = user ? matchBenefits(toWelfareProfile(user), benefits) : [];

  const receivedSet = new Set(user?.receivedBenefitIds ?? []);
  // 지금 받고 계시는 — 받는 ID에 포함된 매칭 (자격 상관없이 우선 표시)
  const receivingList = matched.filter((m) => receivedSet.has(m.benefit.id));
  // 받을 수 있는 — 자격 충족(eligible) 중 아직 안 받는 것
  const availableList = matched.filter(
    (m) => m.status === "eligible" && !receivedSet.has(m.benefit.id),
  );
  const needsDocsList = matched.filter(
    (m) =>
      (m.status === "likely_eligible" || m.status === "needs_more_info") &&
      !receivedSet.has(m.benefit.id),
  );
  const ineligible = matched.filter(
    (m) => m.status === "ineligible" && !receivedSet.has(m.benefit.id),
  );

  const receivingAmounts = summarizeAmounts(receivingList);
  const availableAmounts = summarizeAmounts(availableList);
  const receivingMonthly =
    receivingAmounts.monthlyCashKrw + receivingAmounts.monthlyDiscountKrw;
  const availableMonthly =
    availableAmounts.monthlyCashKrw + availableAmounts.monthlyDiscountKrw;

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-muted)]">
              청바지 · 청춘은 바로 지금
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
              안녕하세요,{" "}
              <span className="text-[var(--color-primary)]">{user?.name ?? "어르신"}</span>님
            </h1>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-2xl">
            👵
          </div>
        </div>
      </header>

      <section className="hero-blue mx-5 mb-5 rounded-2xl p-5">
        <p className="text-[15px] font-medium text-white/80">
          {user?.region} {user?.district} · 전체 {benefits.length}개 제도 검토
        </p>
        <div className={`mt-2 grid gap-2 text-[13px] ${receivingList.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          {receivingList.length > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-3">
              <p className="text-white/70">지금 받고 계신 혜택</p>
              <p className="mt-1 text-[24px] font-extrabold leading-tight">
                {receivingList.length}건
              </p>
              {receivingMonthly > 0 && (
                <p className="text-[12px] text-white/80">
                  매달 약 {receivingMonthly.toLocaleString("ko-KR")}원
                </p>
              )}
            </div>
          )}
          <div className="rounded-xl bg-white/15 px-3 py-3">
            <p className="text-white/70">받으실 수 있는 혜택</p>
            <p className="mt-1 text-[24px] font-extrabold leading-tight">
              {receivingList.length > 0 ? "+" : ""}{availableList.length}건
            </p>
            {availableMonthly > 0 && (
              <p className="text-[12px] text-white/80">
                매달 +약 {availableMonthly.toLocaleString("ko-KR")}원
              </p>
            )}
          </div>
        </div>
        {availableAmounts.annualOneTimeKrw > 0 && (
          <p className="mt-3 text-[13px] text-white/80">
            추가로 연 약{" "}
            {availableAmounts.annualOneTimeKrw.toLocaleString("ko-KR")}원
            일시 지원도 가능해요
          </p>
        )}
      </section>

      {/* 🟢 지금 받고 계시는 혜택 */}
      {receivingList.length > 0 && (
        <section className="mb-6 flex flex-col gap-4 px-5">
          <h2 className="text-[19px] font-bold text-[var(--color-text)]">
            🟢 지금 받고 계시는 혜택 ({receivingList.length}건)
          </h2>
          {receivingList.map((m) => (
            <BenefitCard key={m.benefit.id} m={m} receiving />
          ))}
        </section>
      )}

      {/* ✅ 바로 신청 가능 — eligible & not received */}
      <section className="flex flex-col gap-4 px-5">
        <h2 className="text-[19px] font-bold text-[var(--color-text)]">
          ✅ 바로 신청 가능한 혜택 ({availableList.length}건)
        </h2>
        <p className="text-[13px] text-[var(--color-muted)]">
          단순 자격(나이·국적 등)만으로 받으실 수 있는 혜택이에요. 신청 페이지에서 바로 신청하세요.
        </p>
        {availableList.length > 0 ? (
          availableList.map((m) => <BenefitCard key={m.benefit.id} m={m} />)
        ) : (
          <p className="rounded-2xl bg-white p-5 text-center text-[15px] text-[var(--color-muted)]">
            바로 신청 가능한 혜택은 없어요. 아래 "주민센터 확인 후" 항목을 살펴봐주세요.
          </p>
        )}
      </section>

      {/* 📋 주민센터 확인 후 신청 — likely + needs_more_info */}
      {needsDocsList.length > 0 && (
        <section className="mt-6 flex flex-col gap-4 px-5">
          <h2 className="text-[19px] font-bold text-[var(--color-text)]">
            📋 주민센터 확인 후 신청 가능 ({needsDocsList.length}건)
          </h2>
          <p className="text-[13px] text-[var(--color-muted)]">
            입력하신 정보로는 가능성이 보이나, <strong>최종 자격은 소득인정액·재산환산·가구특성 검토</strong>가 필요해요.
            주민센터 방문하시면 정확히 안내받으실 수 있어요.
          </p>
          {needsDocsList.map((m) => (
            <BenefitCard key={m.benefit.id} m={m} />
          ))}
        </section>
      )}

      {/* 어려운 혜택 (참고, 접힘) */}
      {ineligible.length > 0 && (
        <section className="mt-6 px-5">
          <details className="rounded-2xl bg-white/60 p-4 border border-[var(--color-border)]">
            <summary className="cursor-pointer text-[15px] font-semibold text-[var(--color-muted)]">
              조건이 맞지 않는 혜택 {ineligible.length}건 보기 (참고)
            </summary>
            <ul className="mt-3 space-y-2">
              {ineligible.slice(0, 8).map((m) => (
                <li
                  key={m.benefit.id}
                  className="text-[14px] text-[var(--color-muted)]"
                >
                  • {m.benefit.name} — {m.reasons.find((r) => r.includes("어려워") || r.includes("이상")) ?? m.reasons[0]}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <section className="mx-5 mt-6 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
        <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">도움이 필요하신가요?</span>
          <br />
          신청 절차는 가까운 행정복지센터에서 도와드립니다. 어려우면 품앗이 게시판에 동행 요청을 남겨보세요.
        </p>
      </section>

      <TabBar />
    </main>
  );
}
