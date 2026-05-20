// 마이페이지 — 인터뷰로 입력한 사용자 정보 요약 + 수정 진입점
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/current-user";
import { isOnboarded } from "../lib/auth";
import { calculateAge } from "../lib/age";
import MypageActions from "./mypage-actions";

export const dynamic = "force-dynamic";

const HOUSEHOLD_LABEL: Record<string, string> = {
  single: "단독 가구",
  couple: "부부 가구",
  with_family: "자녀·가족과 함께",
};

const WELFARE_LABEL: Record<string, string> = {
  basic_livelihood: "기초생활수급자",
  near_poverty: "차상위계층",
  none: "해당 없음",
  unknown: "확인 중",
};

const HOUSING_LABEL: Record<string, string> = {
  owned: "자가",
  jeonse: "전세",
  monthly_rent: "월세",
  public_rental: "공공임대",
  unknown: "확인 중",
};

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default async function MyPage() {
  if (!(await isOnboarded())) {
    redirect("/welcome");
  }
  const user = await getCurrentUser();
  if (!user) {
    redirect("/welcome");
  }

  const age = calculateAge(user.birthYear, user.birthMonth);
  const birthMonthText = user.birthMonth ? `${user.birthMonth}월` : "월 미입력";

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col gap-4 bg-[var(--bg-page)] px-5 pt-6 pb-28">
      <header>
        <Link
          href="/"
          className="text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 홈으로
        </Link>
        <h1 className="mt-2 text-[24px] font-extrabold text-[var(--color-text)]">
          마이페이지
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          인터뷰에서 입력한 정보를 확인하고 수정할 수 있어요.
        </p>
      </header>

      {/* 기본 정보 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          👤 기본 정보
        </h2>
        <dl className="flex flex-col gap-2 text-[15px]">
          <Row label="이름" value={user.name} />
          <Row
            label="출생"
            value={`${user.birthYear}년 ${birthMonthText} (만 ${age}세)`}
          />
          <Row label="거주지" value={user.dongName} />
        </dl>
      </section>

      {/* 가구·소득 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          🏠 가구·소득
        </h2>
        <dl className="flex flex-col gap-2 text-[15px]">
          <Row label="가구 형태" value={HOUSEHOLD_LABEL[user.household] ?? user.household} />
          <Row label="가구원 수" value={`${user.householdSize}명`} />
          <Row label="월 소득" value={fmtMoney(user.monthlyIncomeKrw)} />
          <Row label="복지 상태" value={WELFARE_LABEL[user.welfareStatus] ?? user.welfareStatus} />
          <Row label="주거 형태" value={HOUSING_LABEL[user.housingType] ?? user.housingType} />
        </dl>
      </section>

      {/* 일자리 선호 */}
      {user.jobPreferences && (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
            💼 일자리 선호
          </h2>
          <dl className="flex flex-col gap-2 text-[15px]">
            <Row
              label="선호 활동 유형"
              value={
                user.jobPreferences.preferredJobTypes.length > 0
                  ? user.jobPreferences.preferredJobTypes.join(", ")
                  : "—"
              }
            />
            <Row
              label="이전 직종"
              value={
                user.jobPreferences.pastOccupations.length > 0
                  ? user.jobPreferences.pastOccupations.join(", ")
                  : "—"
              }
            />
            <Row
              label="희망 시급"
              value={fmtMoney(user.jobPreferences.desiredHourlyWageKrw)}
            />
            <Row
              label="야외 활동"
              value={user.jobPreferences.outdoorOk ? "가능" : "선호 안 함"}
            />
          </dl>
        </section>
      )}

      {/* 액션 */}
      <MypageActions />

      <p className="text-center text-[12px] text-[var(--color-muted)]">
        입력한 정보는 청바지 서비스 안에서만 사용됩니다.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[13px] font-semibold text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="text-right text-[15px] font-medium text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}
