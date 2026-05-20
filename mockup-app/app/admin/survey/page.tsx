// 어드민 — 설문 응답 통계 대시보드 + CSV 다운로드 (공모전 데모용)
// PIN 게이트 동일 패턴 재사용
import Link from "next/link";
import { computeSurveyStats } from "../../lib/store";
import type { SurveyAgeBand, SurveyPainPoint, SurveyUsagePeriod } from "../../lib/types";

export const dynamic = "force-dynamic";

const PUBLIC_ADMIN_PIN = process.env.ADMIN_PIN ?? "1234";

const PAIN_LABEL: Record<SurveyPainPoint, string> = {
  font_small: "글자 크기",
  slow_loading: "속도·로딩",
  button_layout: "버튼·메뉴 위치",
  guide_unclear: "안내 부족",
  accuracy: "정보 부정확",
  voice_needed: "음성 기능",
  other: "기타",
};

const AGE_LABEL: Record<SurveyAgeBand, string> = {
  "60-64": "60~64",
  "65-69": "65~69",
  "70-74": "70~74",
  "75-79": "75~79",
  "80+": "80+",
  prefer_not: "응답 안 함",
};

const USAGE_LABEL: Record<SurveyUsagePeriod, string> = {
  first: "오늘 처음",
  days: "며칠",
  weeks: "1주~1달",
  month_plus: "1달 이상",
};

const SCREEN_LABEL = {
  welfare: "복지 알리미",
  jobs: "일자리 매칭",
  activity: "활동·미션",
  community: "커뮤니티",
} as const;

function fmt(n: number | null, suffix = ""): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n}${suffix}`;
}

export default async function SurveyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const sp = await searchParams;
  if (sp.pin !== PUBLIC_ADMIN_PIN) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-5 pt-12">
        <h1 className="mb-3 text-[24px] font-extrabold text-[var(--color-text)]">
          🔐 설문 대시보드
        </h1>
        <p className="mb-6 text-[14px] text-[var(--color-muted)]">
          PIN을 입력하세요.
        </p>
        <form method="get" className="flex flex-col gap-3">
          <input
            name="pin"
            type="password"
            placeholder="PIN"
            className="rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary rounded-xl py-3 text-[16px] font-bold"
          >
            로그인
          </button>
        </form>
        <p className="mt-6 text-[12px] text-[var(--color-muted)]">
          데모 PIN: 1234
        </p>
      </main>
    );
  }

  const stats = computeSurveyStats();
  const exportHref = `/api/survey/export`;

  return (
    <main className="mx-auto flex min-h-screen max-w-[640px] flex-col gap-5 bg-[var(--bg-page)] px-5 pt-6 pb-12">
      <header>
        <Link
          href={`/admin?pin=${PUBLIC_ADMIN_PIN}`}
          className="text-[14px] font-bold text-[var(--color-primary)]"
        >
          ← 어드민
        </Link>
        <h1 className="mt-2 text-[24px] font-extrabold text-[var(--color-text)]">
          설문 응답 대시보드
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          /survey 로 들어온 MVP 개선 의견 집계
        </p>
      </header>

      {stats.total === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="text-4xl" aria-hidden>
            📭
          </p>
          <p className="mt-2 text-[16px] font-bold text-[var(--color-text)]">
            아직 응답이 없어요
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            /survey 에서 첫 응답을 받아 보세요.
          </p>
        </div>
      ) : (
        <>
          {/* KPI 카드 */}
          <section className="grid grid-cols-2 gap-3">
            <Kpi label="총 응답" value={`${stats.total}건`} accent />
            <Kpi label="NPS 점수" value={fmt(stats.npsScore)} hint="−100 ~ +100" />
            <Kpi label="평균 NPS" value={fmt(stats.npsAvg, "/10")} />
            <Kpi label="평균 만족도" value={fmt(stats.satisfactionAvg, "/5")} />
          </section>

          {/* NPS 분류 */}
          <section className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
              추천 의향 분포
            </h2>
            <NpsBar
              promoters={stats.npsBreakdown.promoters}
              passives={stats.npsBreakdown.passives}
              detractors={stats.npsBreakdown.detractors}
              total={stats.total}
            />
          </section>

          {/* 화면별 평균 */}
          <section className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
              화면별 만족도 (5점 만점)
            </h2>
            <div className="flex flex-col gap-3">
              {(Object.keys(SCREEN_LABEL) as (keyof typeof SCREEN_LABEL)[]).map(
                (k) => {
                  const s = stats.screenScores[k];
                  return (
                    <ScreenBar
                      key={k}
                      label={SCREEN_LABEL[k]}
                      avg={s.avg}
                      respondents={s.respondents}
                    />
                  );
                },
              )}
            </div>
          </section>

          {/* 페인포인트 */}
          <section className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
              아쉬웠던 점 (다중 선택)
            </h2>
            <div className="flex flex-col gap-2">
              {(Object.keys(PAIN_LABEL) as SurveyPainPoint[])
                .map((k) => ({ key: k, count: stats.painPointCounts[k] }))
                .sort((a, b) => b.count - a.count)
                .map((row) => (
                  <CountBar
                    key={row.key}
                    label={PAIN_LABEL[row.key]}
                    count={row.count}
                    total={stats.total}
                  />
                ))}
            </div>
          </section>

          {/* 인구통계 */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5">
              <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
                연령대
              </h2>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(AGE_LABEL) as SurveyAgeBand[]).map((k) => (
                  <CountBar
                    key={k}
                    label={AGE_LABEL[k]}
                    count={stats.ageBandCounts[k]}
                    total={stats.total}
                    small
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5">
              <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
                사용 기간
              </h2>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(USAGE_LABEL) as SurveyUsagePeriod[]).map((k) => (
                  <CountBar
                    key={k}
                    label={USAGE_LABEL[k]}
                    count={stats.usagePeriodCounts[k]}
                    total={stats.total}
                    small
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 최근 자유 의견 */}
          {stats.recentFeedback.length > 0 && (
            <section className="rounded-2xl bg-white p-5">
              <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
                최근 자유 의견
              </h2>
              <ul className="flex flex-col gap-3">
                {stats.recentFeedback.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[var(--color-border)] p-3"
                  >
                    {r.freeFeedback && (
                      <p className="text-[14px] leading-relaxed text-[var(--color-text)]">
                        {r.freeFeedback}
                      </p>
                    )}
                    {r.painPointDetail && (
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
                        ↳ {r.painPointDetail}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                      {new Date(r.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* CSV 내보내기 */}
      <a
        href={exportHref}
        download
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-center text-[16px] font-bold text-white"
      >
        📥 CSV로 다운로드
      </a>
    </main>
  );
}

// ─── 보조 컴포넌트 ────────────────────────────────────────────

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent
          ? "bg-[var(--color-primary)] text-white"
          : "bg-white text-[var(--color-text)]"
      }`}
    >
      <p
        className={`text-[12px] font-semibold ${
          accent ? "text-white/80" : "text-[var(--color-muted)]"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-[22px] font-extrabold">{value}</p>
      {hint && (
        <p
          className={`text-[11px] ${
            accent ? "text-white/70" : "text-[var(--color-muted)]"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function NpsBar({
  promoters,
  passives,
  detractors,
  total,
}: {
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}) {
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="flex items-center justify-center bg-[var(--color-primary)] text-[12px] font-bold text-white"
          style={{ width: `${pct(promoters)}%` }}
          title={`추천자: ${promoters}명`}
        >
          {pct(promoters) > 12 ? `${pct(promoters)}%` : ""}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-accent)] text-[12px] font-bold text-[#5C4400]"
          style={{ width: `${pct(passives)}%` }}
          title={`중립: ${passives}명`}
        >
          {pct(passives) > 12 ? `${pct(passives)}%` : ""}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-urgent)] text-[12px] font-bold text-white"
          style={{ width: `${pct(detractors)}%` }}
          title={`비추천: ${detractors}명`}
        >
          {pct(detractors) > 12 ? `${pct(detractors)}%` : ""}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-[var(--color-muted)]">
        <span>🟢 추천자 (9~10) {promoters}명</span>
        <span>🟡 중립 (7~8) {passives}명</span>
        <span>🔴 비추천 (0~6) {detractors}명</span>
      </div>
    </div>
  );
}

function ScreenBar({
  label,
  avg,
  respondents,
}: {
  label: string;
  avg: number | null;
  respondents: number;
}) {
  const pct = avg === null ? 0 : (avg / 5) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[14px]">
        <span className="font-bold text-[var(--color-text)]">{label}</span>
        <span className="text-[var(--color-muted)]">
          {avg === null ? "응답 없음" : `${avg.toFixed(2)} · ${respondents}명`}
        </span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-primary)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CountBar({
  label,
  count,
  total,
  small,
}: {
  label: string;
  count: number;
  total: number;
  small?: boolean;
}) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div>
      <div
        className={`flex items-baseline justify-between ${
          small ? "text-[13px]" : "text-[14px]"
        }`}
      >
        <span className="font-semibold text-[var(--color-text)]">{label}</span>
        <span className="text-[var(--color-muted)]">
          {count}명 ({Math.round(pct)}%)
        </span>
      </div>
      <div
        className={`mt-1 ${small ? "h-2" : "h-2.5"} w-full overflow-hidden rounded-full bg-[var(--color-border)]`}
      >
        <div
          className="h-full bg-[var(--color-primary)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
