// 마이페이지 — 인터뷰로 입력한 정보 요약 + 항목별 ✏️ 수정 진입
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/current-user";
import { getProfileOverride, isLegacyCookie, isOnboarded } from "../lib/auth";
import { calculateAge } from "../lib/age";
import { isLocationStale } from "../lib/geo/is-location-stale";
import MypageActions from "./mypage-actions";
import AutoMigrateLocation from "./auto-migrate-location";

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

const DISABILITY_GRADE_LABEL: Record<string, string> = {
  mild: "경증",
  severe: "중증",
  unknown: "확인 중",
  none: "—",
};

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toLocaleString("ko-KR")}원`;
}

export default async function MyPage() {
  if (!(await isOnboarded())) redirect("/welcome");
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");

  const cookieOverride = await getProfileOverride();
  const legacy = isLegacyCookie(cookieOverride);
  const locationStale = isLocationStale(user);

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
          각 항목을 누르시면 그 항목만 수정하실 수 있어요.
        </p>
      </header>

      {/* 옛 사용자 좌표 stale 감지 시 자동 마이그레이션 (1회) — region과 lat/lng 불일치 시만 실행 */}
      {locationStale && <AutoMigrateLocation />}

      {/* 옛 cookie 안내 — 인터뷰 이후 새로 추가된 항목들이 채워지지 않은 상태 */}
      {legacy && (
        <section className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10 p-4">
          <p className="text-[14px] font-bold text-[#8A5E00]">
            ⚠ 이전 형식의 정보가 남아 있어요
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text)]">
            인터뷰 항목이 늘어났는데, 일부 항목이 입력되지 않아 정확한 추천이
            어렵습니다. 아래 &quot;인터뷰 처음부터 다시&quot; 버튼으로 빠르게
            다시 입력해 주세요.
          </p>
        </section>
      )}

      {/* 기본 정보 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          👤 기본 정보
        </h2>
        <ul className="flex flex-col gap-1">
          <EditRow
            href="/mypage/edit/name"
            label="이름"
            value={user.name}
          />
          <EditRow
            href="/mypage/edit/birth"
            label="출생"
            value={`${user.birthYear}년 ${birthMonthText} (만 ${age}세)`}
          />
          <EditRow
            href="/mypage/edit/region"
            label="시·도"
            value={user.region}
          />
          <EditRow
            href="/mypage/edit/district"
            label="시·군·구"
            value={user.district}
          />
        </ul>
      </section>

      {/* 가구·소득 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          🏠 가구·소득
        </h2>
        <ul className="flex flex-col gap-1">
          <EditRow
            href="/mypage/edit/household"
            label="가구 형태·인원"
            value={`${HOUSEHOLD_LABEL[user.household] ?? user.household} · ${user.householdSize}명`}
          />
          <EditRow
            href="/mypage/edit/income"
            label="월 소득"
            value={fmtMoney(user.monthlyIncomeKrw)}
          />
          <EditRow
            href="/mypage/edit/welfare"
            label="복지 상태"
            value={WELFARE_LABEL[user.welfareStatus] ?? user.welfareStatus}
          />
          <EditRow
            href="/mypage/edit/housing"
            label="주거 형태"
            value={HOUSING_LABEL[user.housingType] ?? user.housingType}
          />
        </ul>
      </section>

      {/* 자격 정보 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          🎫 추가 자격 정보
        </h2>
        <ul className="flex flex-col gap-1">
          <EditRow
            href="/mypage/edit/disability"
            label="장애 등록"
            value={
              user.hasDisability
                ? `등록함${
                    user.disabilityGrade && user.disabilityGrade !== "none"
                      ? ` (${DISABILITY_GRADE_LABEL[user.disabilityGrade] ?? user.disabilityGrade})`
                      : ""
                  }`
                : "등록 안 함"
            }
          />
          <EditRow
            href="/mypage/edit/veteran"
            label="국가유공자"
            value={user.isVeteran ? "네" : "아니오"}
          />
          <EditRow
            href="/mypage/edit/youngChild"
            label="영유아 가구원"
            value={user.hasYoungChild ? "네" : "아니오"}
          />
        </ul>
      </section>

      {/* 일자리 선호 — 각 항목 클릭하면 그 항목만 수정 */}
      {user.jobPreferences && (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
            💼 일자리 선호
          </h2>
          <ul className="flex flex-col gap-1">
            <EditRow
              href="/mypage/edit/jobTypes"
              label="선호 활동 유형"
              value={
                user.jobPreferences.preferredJobTypes.length > 0
                  ? user.jobPreferences.preferredJobTypes.join(", ")
                  : "—"
              }
            />
            <EditRow
              href="/mypage/edit/pastOccupations"
              label="이전 직종"
              value={
                user.jobPreferences.pastOccupations.length > 0
                  ? user.jobPreferences.pastOccupations.join(", ")
                  : "—"
              }
            />
            <EditRow
              href="/mypage/edit/timeSlots"
              label="선호 시간대"
              value={
                user.jobPreferences.preferredTimeSlots.length > 0
                  ? user.jobPreferences.preferredTimeSlots
                      .map((t) =>
                        t === "morning" ? "오전" : t === "afternoon" ? "오후" : "저녁",
                      )
                      .join(", ")
                  : "—"
              }
            />
            <EditRow
              href="/mypage/edit/hourlyWage"
              label="희망 시급"
              value={fmtMoney(user.jobPreferences.desiredHourlyWageKrw)}
            />
            <EditRow
              href="/mypage/edit/outdoor"
              label="야외 활동"
              value={user.jobPreferences.outdoorOk ? "가능" : "선호 안 함"}
            />
            <EditRow
              href="/mypage/edit/walkingHeavy"
              label="도보 많은 일"
              value={user.jobPreferences.walkingHeavyOk ? "가능" : "선호 안 함"}
            />
            <EditRow
              href="/mypage/edit/driving"
              label="운전 가능"
              value={user.jobPreferences.drivingOk ? "가능" : "안 됨"}
            />
          </ul>
        </section>
      )}

      <MypageActions />

      <p className="text-center text-[12px] text-[var(--color-muted)]">
        입력한 정보는 청바지 서비스 안에서만 사용됩니다.
      </p>
    </main>
  );
}

function EditRow({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 active:bg-[var(--color-primary)]/5"
      >
        <span className="shrink-0 text-[13px] font-semibold text-[var(--color-muted)]">
          {label}
        </span>
        <span className="flex items-center gap-2 text-right text-[15px] font-medium text-[var(--color-text)]">
          {value}
          <span className="text-[14px] text-[var(--color-muted)]" aria-hidden>
            ›
          </span>
        </span>
      </Link>
    </li>
  );
}

