// 복지 상세 페이지 — 도우다 prototype 기반으로 청바지 톤에 맞게 단순화
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBenefitById } from "../../lib/welfare/content";
import { getCurrentUser } from "../../lib/current-user";

const DOC_GUIDE: Record<string, { how: string; url?: string; urlLabel?: string }> = {
  신분증: { how: "주민등록증 또는 운전면허증을 준비하세요. 이미 가지고 계실 거예요." },
  "신분증 (주민등록증·운전면허증 등)": {
    how: "주민등록증 또는 운전면허증을 준비하세요.",
  },
  주민등록등본: {
    how: "정부24에서 무료로 발급받으실 수 있어요. 주민센터 방문 시 현장 발급도 가능해요.",
    url: "https://www.gov.kr",
    urlLabel: "정부24에서 발급받기",
  },
  "통장 사본": {
    how: "은행 모바일 앱에서 '계좌정보 조회' 화면을 캡처하시면 돼요.",
  },
  "본인 명의 통장 사본": {
    how: "은행 모바일 앱에서 '계좌정보 조회' 화면을 캡처하시면 돼요.",
  },
  "소득·재산 확인 서류": {
    how: "홈택스에서 '소득금액증명원'을 발급받으시거나, 주민센터에서 신청 시 직접 확인해 줘요.",
    url: "https://www.hometax.go.kr",
    urlLabel: "홈택스 바로가기",
  },
  "전·월세 계약서 (해당하실 때)": {
    how: "전세나 월세로 사시는 분만 준비하시면 돼요. 계약서 사본을 챙기세요.",
  },
  가족관계증명서: {
    how: "정부24 또는 대법원 전자가족관계등록시스템에서 무료 발급 가능해요.",
    url: "https://efamily.scourt.go.kr",
    urlLabel: "전자가족관계에서 발급받기",
  },
  건강보험증: {
    how: "건강보험공단 앱 'The건강보험'에서 확인하시거나 가까운 지사에서 발급 가능해요.",
  },
  장애인등록증: {
    how: "이미 가지고 계실 거예요. 분실 시 주민센터에서 재발급 가능해요.",
  },
  "수급자 증명서 (해당 시)": {
    how: "기초생활수급자이신 경우, 주민센터에서 발급받으실 수 있어요.",
  },
  "금융정보 등 제공 동의서 (현장에서 작성하실 수 있어요)": {
    how: "별도로 준비하실 필요 없어요. 주민센터·공단에서 현장 작성하시면 됩니다.",
  },
  "배우자가 있으시면 배우자 신분증": {
    how: "배우자분의 주민등록증을 함께 가져가시면 돼요.",
  },
  "위기 상황 확인 서류 (해고통지서, 진단서 등)": {
    how: "해고통지서, 진단서, 사고 증명서 등 위기 상황을 증빙할 수 있는 서류를 준비하세요.",
  },
};

function householdLabel(h: string): string {
  if (h === "single") return "단독가구";
  if (h === "couple") return "부부가구";
  if (h === "with_family") return "가족 동거 가구";
  return "";
}

export default async function WelfareDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const b = loadBenefitById(id);
  if (!b) notFound();

  const user = await getCurrentUser();

  const amountKey: "single" | "couple" =
    (user?.householdSize ?? 1) >= 2 ? "couple" : "single";
  const amountLabel = user
    ? `${user.householdSize}인 가구`
    : householdLabel(b.eligibility.income_recognition_max ? "single" : "") || "단독가구";

  const hasCashBenefit =
    b.benefit.amount_krw_max &&
    ((b.benefit.amount_krw_max.single ?? 0) > 0 ||
      (b.benefit.amount_krw_max.couple ?? 0) > 0);

  const typeLabel =
    b.benefit.type === "monthly_cash"
      ? "매달 지원"
      : b.benefit.type === "one_time_cash"
      ? "1회 지원"
      : b.benefit.type === "discount"
      ? "할인·감면"
      : "서비스 제공";

  const noteLines = b.notes
    ? b.notes
        .split(/^- /m)
        .map((s) => s.replace(/\n\s*/g, " ").trim())
        .filter((s) => s.length > 0)
    : [];

  // 사용자 소득 vs 기준액 비교
  const MEDIAN_INCOME: Record<number, number> = {
    1: 2_228_445, 2: 3_682_609, 3: 4_714_657,
    4: 5_729_913, 5: 6_695_735, 6: 7_618_369,
  };
  let incomeLimit: number | undefined;
  if (b.eligibility.median_income_pct && user?.householdSize) {
    const size = Math.min(Math.max(user.householdSize, 1), 6);
    incomeLimit = Math.floor(
      ((MEDIAN_INCOME[size] ?? MEDIAN_INCOME[6]) * b.eligibility.median_income_pct) / 100,
    );
  } else if (b.eligibility.income_recognition_max) {
    incomeLimit =
      b.eligibility.income_recognition_max[amountKey] ??
      b.eligibility.income_recognition_max.couple ??
      b.eligibility.income_recognition_max.single;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/welfare"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 복지 알리미로
        </Link>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[13px] font-bold text-[var(--color-primary)]">
            {b.category}
          </span>
          <span className="text-[13px] text-[var(--color-muted)]">{typeLabel}</span>
        </div>
        <h1 className="text-[26px] font-extrabold leading-tight text-[var(--color-text)]">
          {b.name}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">{b.agency}</p>
      </header>

      {/* 요약 */}
      <section className="mx-5 mb-5 rounded-2xl border-2 border-[var(--color-border)] bg-white p-5">
        <p
          className="text-[16px] leading-relaxed text-[var(--color-text)]"
          style={{ wordBreak: "keep-all" }}
        >
          {b.summary}
        </p>
      </section>

      {/* 나의 조건 매칭 */}
      {user && (user.monthlyIncomeKrw !== null || incomeLimit) && (
        <section className="mx-5 mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
            <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-success)]" />
            나의 조건
          </h2>
          <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-5">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              <li>
                <span className="font-bold">가구 형태: </span>
                {amountLabel}
              </li>
              {user.monthlyIncomeKrw !== null && incomeLimit !== undefined && (
                <li>
                  <span className="font-bold">가구 합산 월 소득: </span>
                  약 {user.monthlyIncomeKrw.toLocaleString("ko-KR")}원
                  <span className="ml-1 text-[12px] text-[var(--color-muted)]">
                    (입력하신 값)
                  </span>
                  {user.monthlyIncomeKrw <= incomeLimit ? (
                    <span className="mt-1 block font-bold text-[var(--color-success)]">
                      → 소득 기준 충족 (기준 {incomeLimit.toLocaleString("ko-KR")}원 이하)
                    </span>
                  ) : (
                    <span className="mt-1 block font-bold text-[var(--color-urgent)]">
                      → 소득 기준 초과 (기준 {incomeLimit.toLocaleString("ko-KR")}원 이하)
                    </span>
                  )}
                </li>
              )}
            </ul>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
            ⚠ 실제 자격 판정은 <strong>소득인정액</strong>(가구 전체 소득 + 재산의 월 환산)을 기준으로 하며,{" "}
            가구특성지출·재산공제 등이 추가로 반영됩니다. 정확한 자격은 주민센터·복지로에서 다시 확인해주세요.
          </p>
        </section>
      )}

      {/* 지원 금액 */}
      {hasCashBenefit && (
        <section className="mx-5 mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
            <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-primary)]" />
            지원 금액
          </h2>
          <div className="rounded-2xl bg-[var(--color-primary)]/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px]">{amountLabel} (최대)</span>
              <span className="text-[24px] font-extrabold text-[var(--color-primary)]">
                {(b.benefit.amount_krw_max?.[amountKey] ??
                  b.benefit.amount_krw_max?.single ??
                  0
                ).toLocaleString("ko-KR")}
                원
              </span>
            </div>
            <p className="mt-3 text-[13px] text-[var(--color-muted)]">
              {b.benefit.type === "monthly_cash" ? "매달 지급" : "1회 지급"}
            </p>
          </div>
        </section>
      )}

      {/* 대상 조건 */}
      <section className="mx-5 mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
          <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-primary)]" />
          누가 받을 수 있나요?
        </h2>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <ul className="space-y-2 text-[15px] leading-relaxed">
            {b.eligibility.age_min !== undefined && (
              <li>
                <span className="font-bold">나이: </span>
                만 {b.eligibility.age_min}세 이상
                {b.eligibility.age_max !== undefined &&
                  ` ~ 만 ${b.eligibility.age_max}세 이하`}
              </li>
            )}
            {b.eligibility.income_recognition_max && (
              <li>
                <span className="font-bold">소득 기준: </span>
                단독가구 월{" "}
                {(b.eligibility.income_recognition_max.single ?? 0).toLocaleString("ko-KR")}원 이하
                {b.eligibility.income_recognition_max.couple &&
                  b.eligibility.income_recognition_max.couple !==
                    b.eligibility.income_recognition_max.single && (
                    <>
                      {" "}/ 부부가구 월{" "}
                      {b.eligibility.income_recognition_max.couple.toLocaleString("ko-KR")}원 이하
                    </>
                  )}
              </li>
            )}
            {b.eligibility.requires_disability && (
              <li>
                <span className="font-bold">장애: </span>등록 장애인
              </li>
            )}
            {b.eligibility.requires_renter && (
              <li>
                <span className="font-bold">주거: </span>
                임차(전세/월세) 가구 대상
              </li>
            )}
            {b.eligibility.requires_crisis && (
              <li>
                <span className="font-bold">위기 상황: </span>
                실직·질병·사고 등
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* 알아두시면 좋은 점 */}
      {noteLines.length > 0 && (
        <section className="mx-5 mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
            <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-accent)]" />
            알아두시면 좋은 점
          </h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <ul className="space-y-3 text-[15px] leading-relaxed">
              {noteLines.map((note, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-[var(--color-accent)]">*</span>
                  <span style={{ wordBreak: "keep-all" }}>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 준비하실 서류 */}
      {b.documents?.length > 0 && (
        <section className="mx-5 mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
            <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-primary)]" />
            준비하실 서류
          </h2>
          <div className="flex flex-col gap-3">
            {b.documents.map((doc, i) => {
              const guide = DOC_GUIDE[doc];
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                >
                  <p className="mb-1 text-[15px] font-bold text-[var(--color-text)]">
                    {doc}
                  </p>
                  {guide ? (
                    <>
                      <p
                        className="text-[13px] leading-relaxed text-[var(--color-muted)]"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {guide.how}
                      </p>
                      {guide.url && (
                        <a
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-[13px] font-bold text-[var(--color-primary)]"
                        >
                          {guide.urlLabel ?? "발급 바로가기"} →
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-[13px] text-[var(--color-muted)]">
                      주민센터 방문 시 안내받으실 수 있어요.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 신청 방법 */}
      <section className="mx-5 mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
          <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-primary)]" />
          신청 방법
        </h2>
        <div className="flex flex-col gap-3">
          {b.apply?.online && (
            <a
              href={b.apply.online.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl bg-[var(--color-primary)] py-4 text-center text-[17px] font-bold text-white"
            >
              {b.apply.online.name}에서 온라인 신청 → (+100P)
            </a>
          )}
          {b.apply?.offline && b.apply.offline.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <p className="mb-2 text-[13px] font-bold text-[var(--color-muted)]">
                직접 방문 신청
              </p>
              <ul className="space-y-2 text-[15px]">
                {b.apply.offline.map((place, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 text-[var(--color-primary)]">*</span>
                    {place}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 안내 */}
      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        이 정보는{" "}
        {typeof b.last_verified === "object" && b.last_verified !== null
          ? (b.last_verified as unknown as Date).toISOString().slice(0, 10)
          : String(b.last_verified)}{" "}
        기준이며, 정확한 자격과 금액은 주민센터·복지로에서 다시 확인해 주세요.
      </p>
    </main>
  );
}
