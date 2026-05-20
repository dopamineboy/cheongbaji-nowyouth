"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfile } from "../../lib/types";

const HOUSEHOLD_OPTS: { value: UserProfile["household"]; label: string }[] = [
  { value: "single", label: "단독 가구" },
  { value: "couple", label: "부부 가구" },
  { value: "with_family", label: "자녀·가족과 함께" },
];

const WELFARE_OPTS: { value: UserProfile["welfareStatus"]; label: string }[] = [
  { value: "basic_livelihood", label: "기초생활수급자" },
  { value: "near_poverty", label: "차상위계층" },
  { value: "none", label: "해당 없음" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const HOUSING_OPTS: { value: UserProfile["housingType"]; label: string }[] = [
  { value: "owned", label: "자가" },
  { value: "jeonse", label: "전세" },
  { value: "monthly_rent", label: "월세" },
  { value: "public_rental", label: "공공임대" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const DISABILITY_GRADE_OPTS: { value: NonNullable<UserProfile["disabilityGrade"]>; label: string }[] = [
  { value: "none", label: "등록 안 함" },
  { value: "mild", label: "경증" },
  { value: "severe", label: "중증" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const DECADES = [1930, 1940, 1950, 1960, 1970];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function EditForm({ initial }: { initial: UserProfile }) {
  const router = useRouter();
  const [s, setS] = useState({
    birthYear: initial.birthYear,
    birthMonth: initial.birthMonth ?? null,
    household: initial.household,
    householdSize: initial.householdSize,
    monthlyIncomeKrw: initial.monthlyIncomeKrw,
    welfareStatus: initial.welfareStatus,
    housingType: initial.housingType,
    hasDisability: initial.hasDisability,
    disabilityGrade: initial.disabilityGrade ?? null,
    isVeteran: initial.isVeteran ?? false,
    hasYoungChild: initial.hasYoungChild ?? false,
  });
  const [yearDecade, setYearDecade] = useState<number | null>(
    Math.floor(initial.birthYear / 10) * 10,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // 변경된 필드만 골라 보내기
  const diff = (): Partial<UserProfile> => {
    const d: Partial<UserProfile> = {};
    if (s.birthYear !== initial.birthYear) d.birthYear = s.birthYear;
    if ((s.birthMonth ?? null) !== (initial.birthMonth ?? null))
      d.birthMonth = s.birthMonth;
    if (s.household !== initial.household) d.household = s.household;
    if (s.householdSize !== initial.householdSize) d.householdSize = s.householdSize;
    if (s.monthlyIncomeKrw !== initial.monthlyIncomeKrw)
      d.monthlyIncomeKrw = s.monthlyIncomeKrw;
    if (s.welfareStatus !== initial.welfareStatus) d.welfareStatus = s.welfareStatus;
    if (s.housingType !== initial.housingType) d.housingType = s.housingType;
    if (s.hasDisability !== initial.hasDisability) d.hasDisability = s.hasDisability;
    if ((s.disabilityGrade ?? null) !== (initial.disabilityGrade ?? null))
      d.disabilityGrade = s.disabilityGrade ?? undefined;
    if (s.isVeteran !== (initial.isVeteran ?? false)) d.isVeteran = s.isVeteran;
    if (s.hasYoungChild !== (initial.hasYoungChild ?? false))
      d.hasYoungChild = s.hasYoungChild;
    return d;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    const changes = diff();
    if (Object.keys(changes).length === 0) {
      setError("바꾸신 내용이 없어요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "저장에 실패했어요.");
        setSaving(false);
        return;
      }
      setSavedMsg(`${Object.keys(changes).length}개 항목이 저장됐어요.`);
      setSaving(false);
      // 마이페이지·홈에서 새 값으로 다시 매칭되도록 라우터 새로고침
      router.refresh();
      setTimeout(() => router.push("/mypage"), 800);
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* 출생 연도 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          출생 연도
        </h2>
        <div className="mb-2 grid grid-cols-5 gap-1.5">
          {DECADES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setYearDecade(d)}
              className={`rounded-xl py-2 text-[13px] font-bold ${
                yearDecade === d
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {d}년대
            </button>
          ))}
        </div>
        {yearDecade !== null && (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => yearDecade + i).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setS({ ...s, birthYear: y })}
                className={`rounded-xl py-2 text-[15px] font-bold ${
                  s.birthYear === y
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 출생 월 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          태어난 달
        </h2>
        <div className="grid grid-cols-6 gap-1.5">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setS({ ...s, birthMonth: m })}
              className={`rounded-xl py-2 text-[14px] font-bold ${
                s.birthMonth === m
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {m}월
            </button>
          ))}
        </div>
      </section>

      {/* 가구 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          가구 형태 / 가구원 수
        </h2>
        <div className="mb-3 flex flex-col gap-2">
          {HOUSEHOLD_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setS({ ...s, household: o.value })}
              className={`rounded-2xl px-4 py-3 text-left text-[15px] font-bold ${
                s.household === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label className="text-[14px] font-bold text-[var(--color-text)]">
          가구원 수
        </label>
        <input
          type="number"
          min={1}
          max={10}
          value={s.householdSize}
          onChange={(e) => setS({ ...s, householdSize: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-2 text-[16px]"
        />
      </section>

      {/* 소득·복지 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          월 소득 / 복지 상태
        </h2>
        <label className="text-[14px] font-bold text-[var(--color-text)]">
          가구 월 소득(원)
        </label>
        <input
          type="number"
          min={0}
          step={10000}
          value={s.monthlyIncomeKrw ?? ""}
          placeholder="예: 1500000"
          onChange={(e) => {
            const v = e.target.value;
            setS({ ...s, monthlyIncomeKrw: v === "" ? null : Number(v) });
          }}
          className="mt-1 w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-2 text-[16px]"
        />
        <div className="mt-3 flex flex-col gap-2">
          {WELFARE_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setS({ ...s, welfareStatus: o.value })}
              className={`rounded-2xl px-4 py-2.5 text-left text-[15px] font-bold ${
                s.welfareStatus === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* 주거 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          주거 형태
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {HOUSING_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setS({ ...s, housingType: o.value })}
              className={`rounded-2xl px-3 py-3 text-[15px] font-bold ${
                s.housingType === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* 자격 정보 */}
      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
          추가 자격 정보
        </h2>
        <p className="mb-3 text-[12px] text-[var(--color-muted)]">
          이 정보로 맞춤 추천 정확도가 크게 올라가요. 모르면 그대로 두셔도 됩니다.
        </p>

        <label className="text-[14px] font-bold text-[var(--color-text)]">
          장애 등록
        </label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setS({ ...s, hasDisability: true })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              s.hasDisability
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            등록함
          </button>
          <button
            type="button"
            onClick={() => setS({ ...s, hasDisability: false, disabilityGrade: "none" })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              !s.hasDisability
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            등록 안 함
          </button>
        </div>

        {s.hasDisability && (
          <>
            <label className="mt-3 block text-[14px] font-bold text-[var(--color-text)]">
              장애 등급
            </label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {DISABILITY_GRADE_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setS({ ...s, disabilityGrade: o.value })}
                  className={`rounded-xl py-2 text-[13px] font-bold ${
                    s.disabilityGrade === o.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="mt-3 block text-[14px] font-bold text-[var(--color-text)]">
          국가유공자 여부
        </label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setS({ ...s, isVeteran: true })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              s.isVeteran
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            네
          </button>
          <button
            type="button"
            onClick={() => setS({ ...s, isVeteran: false })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              !s.isVeteran
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            아니오
          </button>
        </div>

        <label className="mt-3 block text-[14px] font-bold text-[var(--color-text)]">
          가구원 중 영유아 (만 6세 이하) 있나요?
        </label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setS({ ...s, hasYoungChild: true })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              s.hasYoungChild
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            네
          </button>
          <button
            type="button"
            onClick={() => setS({ ...s, hasYoungChild: false })}
            className={`rounded-xl py-2.5 text-[14px] font-bold ${
              !s.hasYoungChild
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            아니오
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
          {error}
        </p>
      )}
      {savedMsg && (
        <p className="rounded-xl bg-[var(--color-success)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-success)]">
          ✓ {savedMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-[18px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "변경한 항목 저장하기"}
      </button>
    </form>
  );
}
