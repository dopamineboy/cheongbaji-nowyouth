// 0원 나들이 코스 상세 — 스탬프 인증 + 포인트 적립
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOutingById, getSpotsByIds } from "../../../lib/outings/data";
import StampBoard from "./stamp-board";

export const dynamic = "force-dynamic";

const STAMINA_LABEL: Record<string, string> = {
  easy: "쉬움 · 도보 적음",
  mid: "보통 · 천천히 산책",
  heavy: "많이 걷기",
};

const WEATHER_LABEL: Record<string, string> = {
  indoor: "🏠 실내 · 비 와도 OK",
  outdoor: "☀️ 야외",
  any: "🌤 실내·외 혼합",
};

export default async function OutingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outing = getOutingById(id);
  if (!outing) notFound();
  const spots = getSpotsByIds(outing.spotIds);

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/activity/outings"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-warm-strong)]"
        >
          ← 코스 목록으로
        </Link>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[var(--color-warm)]/15 px-3 py-1 text-[12px] font-bold text-[var(--color-warm-strong)]">
            🚇 {outing.line}
          </span>
          <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-success)]">
            💸 0원
          </span>
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-primary)]">
            {STAMINA_LABEL[outing.stamina]}
          </span>
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          {outing.title}
        </h1>
        <p
          className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]"
          style={{ wordBreak: "keep-all" }}
        >
          {outing.description}
        </p>
      </header>

      {/* 코스 요약 */}
      <section className="hero-warm mx-5 mb-5 rounded-2xl p-5 text-white">
        <p className="text-[13px] font-medium text-white/85">오늘의 0원 나들이</p>
        <h2 className="mt-1 text-[20px] font-extrabold leading-tight">
          {spots.length}곳 · 약 {Math.floor(outing.totalMinutes / 60)}시간 코스
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px]">
          <div className="rounded-xl bg-white/15 py-3">
            <p className="text-white/75">예상 보행</p>
            <p className="mt-0.5 text-[18px] font-extrabold">
              {outing.totalSteps.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/75">보</p>
          </div>
          <div className="rounded-xl bg-white/15 py-3">
            <p className="text-white/75">예상 비용</p>
            <p className="mt-0.5 text-[18px] font-extrabold">{outing.totalCost}원</p>
            <p className="text-[11px] text-white/75">교통·입장</p>
          </div>
          <div className="rounded-xl bg-white/15 py-3">
            <p className="text-white/75">완료 보상</p>
            <p className="mt-0.5 text-[18px] font-extrabold">
              +{outing.totalRewardPoints}
            </p>
            <p className="text-[11px] text-white/75">포인트</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {outing.reasonTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              {t}
            </span>
          ))}
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
            {WEATHER_LABEL[outing.weatherFit]}
          </span>
        </div>
      </section>

      {/* 준비물 */}
      {outing.needs.length > 0 && (
        <section className="mx-5 mb-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
            🎒 준비물
          </h2>
          <div className="flex flex-wrap gap-2">
            {outing.needs.map((n) => (
              <span
                key={n}
                className="rounded-lg bg-[var(--bg-soft-blue)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-text)]"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-muted)]">
            💡 경로우대 교통카드는 가까운 주민센터 또는 지정 은행에서 신분증 지참 시 발급받으실 수 있어요.
          </p>
        </section>
      )}

      {/* 방문 순서 + 스탬프 인증 */}
      <StampBoard outingId={outing.id} spots={spots} totalBonus={outing.totalRewardPoints} />

      {/* 안전 안내 */}
      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        ⚠ 무리하지 마시고, 더운 날에는 충분히 쉬어가세요. 가족에게 일정을 공유해두시면 더 안전해요.
        무료 입장 정책은 시설별로 변경될 수 있으니 신분증을 꼭 지참하세요.
      </p>
    </main>
  );
}
