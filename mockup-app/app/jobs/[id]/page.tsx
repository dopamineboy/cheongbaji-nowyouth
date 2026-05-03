// 일자리 디테일 페이지
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "../../lib/store";
import { getCurrentUser } from "../../lib/current-user";
import { haversineKm, scoreJob } from "../../lib/jobs/match";
import ApplyButton from "./apply-button";

const TIME_LABEL: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  flexible: "유연",
};

const DIFF_LABEL: Record<string, string> = {
  low: "쉬움",
  mid: "보통",
  high: "체력 필요",
};

function commuteText(km: number): string {
  if (km < 1) return `도보 약 ${Math.round(km * 20)}분`;
  if (km < 5) return `${km.toFixed(1)}km · 대중교통 약 ${Math.round(km * 8)}분`;
  return `${km.toFixed(1)}km · 환승 포함 약 ${Math.round(km * 6 + 10)}분`;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getStore().jobs.find((j) => j.id === id);
  if (!job) notFound();
  const user = await getCurrentUser();
  const distanceKm = user
    ? haversineKm(user.lat, user.lng, job.lat, job.lng)
    : 0;
  const scored = user ? scoreJob(user, job) : null;

  const expiresDate = new Date(job.expiresAt);
  const daysLeft = Math.ceil(
    (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/jobs"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 일자리 목록으로
        </Link>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[13px] font-bold text-[var(--color-primary)]">
            {job.activityType}
          </span>
          <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
            난이도 {DIFF_LABEL[job.difficulty]}
          </span>
          <span className="text-[13px] text-[var(--color-muted)]">{job.source}</span>
        </div>
        <h1 className="text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          {job.title}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">{job.org}</p>
      </header>

      {scored && (
        <section className="hero-blue mx-5 mb-5 rounded-2xl p-5">
          <p className="text-[14px] font-medium text-white/80">나와의 적합도</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold leading-tight">
              {scored.score}
            </span>
            <span className="text-[18px] font-medium">/ 100점</span>
          </div>
          <p className="mt-2 text-[14px] text-white/80">{scored.matchReason}</p>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[12px]">
            <ScoreBar label="거리" v={scored.scoreBreakdown.distance} max={25} />
            <ScoreBar label="경력" v={scored.scoreBreakdown.career} max={25} />
            <ScoreBar label="시간" v={scored.scoreBreakdown.time} max={20} />
            <ScoreBar label="임금" v={scored.scoreBreakdown.wage} max={15} />
            <ScoreBar label="유형" v={scored.scoreBreakdown.activity} max={15} />
          </div>
        </section>
      )}

      <section className="mx-5 mb-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">근무 조건</h2>
        <ul className="space-y-2 text-[15px] leading-relaxed">
          <li>
            <span className="font-bold">시급: </span>
            <span className="text-[var(--color-primary)] font-extrabold">
              {job.wageKrwPerHour.toLocaleString()}원
            </span>
          </li>
          <li>
            <span className="font-bold">근무: </span>주 {job.hoursPerWeek}시간 ·{" "}
            {TIME_LABEL[job.timeSlot]}
          </li>
          <li>
            <span className="font-bold">일정: </span>
            {job.schedule}
          </li>
          <li>
            <span className="font-bold">위치: </span>
            {job.regionName}
            {distanceKm > 0 && (
              <span className="text-[var(--color-muted)]"> · {commuteText(distanceKm)}</span>
            )}
          </li>
          <li>
            <span className="font-bold">신체 조건: </span>
            <span className="text-[var(--color-muted)]">
              {[
                job.outdoor && "야외",
                job.walkingHeavy && "이동 많음",
                job.drivingRequired && "운전",
              ]
                .filter(Boolean)
                .join(" · ") || "특별한 신체 조건 없음"}
            </span>
          </li>
          <li>
            <span className="font-bold">마감: </span>
            {expiresDate.toLocaleDateString("ko-KR")}
            {daysLeft <= 14 && (
              <span className="ml-2 rounded-full bg-[var(--color-urgent)]/10 px-2 py-0.5 text-[12px] font-bold text-[var(--color-urgent)]">
                D-{daysLeft}
              </span>
            )}
          </li>
        </ul>
      </section>

      {job.requirements.length > 0 && (
        <section className="mx-5 mb-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
            지원 자격
          </h2>
          <ul className="space-y-2">
            {job.requirements.map((r, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
                <span className="shrink-0 text-[var(--color-primary)]">*</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-5 mb-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
          담당 기관
        </h2>
        <p className="text-[15px]">
          <span className="font-bold">전화: </span>
          <a
            href={`tel:${job.contactPhone}`}
            className="text-[var(--color-primary)]"
          >
            {job.contactPhone || "기관 안내 참조"}
          </a>
        </p>
      </section>

      <section className="mx-5 mb-8 flex flex-col gap-3">
        <ApplyButton jobId={job.id} applyUrl={job.applyUrl} />
        <Link
          href={`/community/new?category=life_help&prefill=${encodeURIComponent(`${job.title} 신청 같이 가실 분`)}`}
          className="block rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-center text-[16px] font-semibold text-[var(--color-primary)]"
        >
          커뮤니티로 동행 요청하기
        </Link>
      </section>

      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        한국노인인력개발원 통합정보 기반 데이터 · 정확한 자격과 시급은 담당 기관에서 다시 확인해주세요.
      </p>
    </main>
  );
}

function ScoreBar({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.round((v / max) * 100);
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
        <div className="h-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-white/70">{label}</p>
      <p className="font-bold">{v}</p>
    </div>
  );
}
