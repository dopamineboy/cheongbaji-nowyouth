// 어드민 — 앱 사용 설문 응답 통계 대시보드 + CSV 다운로드
// 객관식 10문항 × ①·②·③ 분포 막대 + 서술 3문항 최근 응답
import Link from "next/link";
import { computeSurveyStats } from "../../lib/store";
import { SURVEY_CHOICE_KEYS, type SurveyChoiceKey } from "../../lib/types";

export const dynamic = "force-dynamic";

const PUBLIC_ADMIN_PIN = process.env.ADMIN_PIN ?? "1234";

const QUESTION_META: Record<
  SurveyChoiceKey,
  { num: number; label: string; options: [string, string, string] }
> = {
  q1_ease:          { num: 1,  label: "사용 쉬움",         options: ["매우 쉬움",   "보통",    "어려움"] },
  q2_understanding: { num: 2,  label: "앱 정체 이해",      options: ["잘 이해됨",   "조금 헷갈림", "전혀 모름"] },
  q3_findFeature:   { num: 3,  label: "기능 찾기",         options: ["매우 쉬움",   "보통",    "어려움"] },
  q4_confusion:     { num: 4,  label: "어디 눌러야 헷갈림", options: ["전혀 없음",   "가끔",    "자주"] },
  q5_readability:   { num: 5,  label: "글씨·화면",         options: ["매우 편함",   "보통",    "불편함"] },
  q6_buttons:       { num: 6,  label: "버튼 누르기",       options: ["매우 쉬움",   "보통",    "어려움"] },
  q7_mistakes:      { num: 7,  label: "실수 잘못 누름",     options: ["없음",        "가끔",    "자주"] },
  q8_selfUse:       { num: 8,  label: "혼자 다시 사용",    options: ["충분히 가능", "조금 어려움", "거의 불가능"] },
  q9_satisfaction:  { num: 9,  label: "전반 만족",         options: ["매우 만족",   "보통",    "불만족"] },
  q10_continue:     { num: 10, label: "계속 사용 의향",    options: ["있음",        "고민됨",  "없음"] },
};

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

  // 긍정 비율(①을 선택한 비율)이 낮은 순으로 정렬 → 개선 우선순위
  const sortedKeys = [...SURVEY_CHOICE_KEYS].sort((a, b) => {
    const ra =
      stats.choices[a].respondents > 0
        ? stats.choices[a].counts[1] / stats.choices[a].respondents
        : 1;
    const rb =
      stats.choices[b].respondents > 0
        ? stats.choices[b].counts[1] / stats.choices[b].respondents
        : 1;
    return ra - rb;
  });

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
          앱 사용 설문 대시보드
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          /survey 로 들어온 사용성 평가 + 개선 의견
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
            <Kpi
              label="긍정 응답 비율"
              value={fmt(positiveRate(stats), "%")}
              hint="① 평균 비율"
            />
          </section>

          {/* 객관식 10문항 — 분포 막대 (개선 시급한 문항 위로) */}
          <section className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
              객관식 응답 분포{" "}
              <span className="text-[12px] font-normal text-[var(--color-muted)]">
                · 부정 비율 높은 순
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {sortedKeys.map((k) => (
                <ChoiceDistribution
                  key={k}
                  num={QUESTION_META[k].num}
                  label={QUESTION_META[k].label}
                  options={QUESTION_META[k].options}
                  stats={stats.choices[k]}
                />
              ))}
            </div>
          </section>

          {/* 기타 자유 입력 (객관식의 etc 모음) */}
          {Object.values(stats.choices).some((c) => c.etcAnswers.length > 0) && (
            <section className="rounded-2xl bg-white p-5">
              <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
                객관식 &quot;기타&quot; 의견
              </h2>
              <div className="flex flex-col gap-3">
                {SURVEY_CHOICE_KEYS.filter(
                  (k) => stats.choices[k].etcAnswers.length > 0,
                ).map((k) => (
                  <div key={k}>
                    <p className="text-[14px] font-bold text-[var(--color-text)]">
                      {QUESTION_META[k].num}. {QUESTION_META[k].label}
                    </p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {stats.choices[k].etcAnswers.slice(0, 5).map((t, i) => (
                        <li
                          key={i}
                          className="text-[13px] leading-relaxed text-[var(--color-muted)]"
                        >
                          • {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 서술 3문항 */}
          <FreeTextSection
            title="11. 가장 좋았던 점"
            items={stats.liked}
            emptyText="아직 응답이 없어요"
          />
          <FreeTextSection
            title="12. 가장 불편했던 점"
            items={stats.disliked}
            emptyText="아직 응답이 없어요"
          />
          <FreeTextSection
            title="13. 하나만 바꾼다면"
            items={stats.oneChange}
            emptyText="아직 응답이 없어요"
          />
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

// ─── 보조 함수·컴포넌트 ───────────────────────────────────────

function positiveRate(stats: ReturnType<typeof computeSurveyStats>): number | null {
  // 객관식 10문항 모두에 대해 ① 비율의 평균
  const rates: number[] = [];
  for (const k of SURVEY_CHOICE_KEYS) {
    const c = stats.choices[k];
    if (c.respondents === 0) continue;
    rates.push(c.counts[1] / c.respondents);
  }
  if (rates.length === 0) return null;
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  return Math.round(avg * 100);
}

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

function ChoiceDistribution({
  num,
  label,
  options,
  stats,
}: {
  num: number;
  label: string;
  options: [string, string, string];
  stats: ReturnType<typeof computeSurveyStats>["choices"][SurveyChoiceKey];
}) {
  const total = stats.respondents;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  const p1 = pct(stats.counts[1]);
  const p2 = pct(stats.counts[2]);
  const p3 = pct(stats.counts[3]);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-[14px] font-bold text-[var(--color-text)]">
          {num}. {label}
        </p>
        <p className="text-[12px] text-[var(--color-muted)]">
          {total === 0 ? "응답 없음" : `${total}명`}
        </p>
      </div>
      <div className="flex h-7 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="flex items-center justify-center bg-[var(--color-primary)] text-[11px] font-bold text-white"
          style={{ width: `${p1}%` }}
          title={`① ${options[0]}: ${stats.counts[1]}명`}
        >
          {p1 > 10 ? `${p1}%` : ""}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-accent)] text-[11px] font-bold text-[#5C4400]"
          style={{ width: `${p2}%` }}
          title={`② ${options[1]}: ${stats.counts[2]}명`}
        >
          {p2 > 10 ? `${p2}%` : ""}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-urgent)] text-[11px] font-bold text-white"
          style={{ width: `${p3}%` }}
          title={`③ ${options[2]}: ${stats.counts[3]}명`}
        >
          {p3 > 10 ? `${p3}%` : ""}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap justify-between gap-2 text-[11px] text-[var(--color-muted)]">
        <span>① {options[0]} {stats.counts[1]}명</span>
        <span>② {options[1]} {stats.counts[2]}명</span>
        <span>③ {options[2]} {stats.counts[3]}명</span>
      </div>
    </div>
  );
}

function FreeTextSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { id: string; createdAt: string; text: string }[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)]">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--color-border)] p-3"
            >
              <p className="text-[14px] leading-relaxed text-[var(--color-text)]">
                {r.text}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                {new Date(r.createdAt).toLocaleString("ko-KR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
