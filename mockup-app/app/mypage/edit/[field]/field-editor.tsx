"use client";

// 마이페이지 — 항목별 작은 폼 (한 화면 한 항목)
// 저장 후 /mypage로 복귀
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDistricts } from "../../../lib/geo/districts";
import type {
  JobActivityType,
  JobPreferences,
  TimeSlot,
  UserProfile,
} from "../../../lib/types";

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
  { value: "mild", label: "경증" },
  { value: "severe", label: "중증" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const REGIONS = [
  "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "강원특별자치도", "충청북도", "충청남도", "전북특별자치도",
  "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

const DECADES = [1930, 1940, 1950, 1960, 1970];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const JOB_TYPE_OPTS: { value: JobActivityType; label: string; desc: string }[] = [
  { value: "공익활동형",  label: "공익활동형", desc: "환경정비·안전관리 등 공공" },
  { value: "사회서비스형", label: "사회서비스형", desc: "돌봄·교육보조 등 경험 활용" },
  { value: "시장형",      label: "시장형",     desc: "카페·택배·공동작업장 등 수익형" },
  { value: "민간",        label: "민간",       desc: "민간기업 일자리" },
];

const TIME_SLOT_OPTS: { value: TimeSlot; label: string }[] = [
  { value: "morning",   label: "오전" },
  { value: "afternoon", label: "오후" },
  { value: "evening",   label: "저녁" },
];

// 온보딩과 동일한 15개 직종 (lib/jobs/match.ts의 OCCUPATION_SYNONYMS와 키 1:1 매칭)
const OCCUPATION_OPTS = [
  "교육", "사무·행정", "주방·식당", "보육·돌봄",
  "운수·교통", "환경·청소", "공방·수공예", "응대·안내",
  "건설·기능직", "판매·영업", "의료·간호", "농업·임업",
  "관리·경비", "IT·전산", "예술·문화",
];

interface Props {
  field: string;
  user: UserProfile;
}

export default function FieldEditor({ field, user }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 필드별 로컬 상태
  const [name, setName] = useState(user.name);
  const [birthYear, setBirthYear] = useState(user.birthYear);
  const [birthMonth, setBirthMonth] = useState<number | null>(user.birthMonth ?? null);
  const [yearDecade, setYearDecade] = useState<number | null>(
    Math.floor(user.birthYear / 10) * 10,
  );
  const [region, setRegion] = useState(user.region);
  const [district, setDistrict] = useState(user.district);
  const [household, setHousehold] = useState(user.household);
  const [householdSize, setHouseholdSize] = useState(user.householdSize);
  const [monthlyIncomeKrw, setMonthlyIncomeKrw] = useState(user.monthlyIncomeKrw);
  const [welfareStatus, setWelfareStatus] = useState(user.welfareStatus);
  const [housingType, setHousingType] = useState(user.housingType);
  const [hasDisability, setHasDisability] = useState(user.hasDisability);
  const [disabilityGrade, setDisabilityGrade] = useState<UserProfile["disabilityGrade"]>(
    user.disabilityGrade ?? undefined,
  );
  const [isVeteran, setIsVeteran] = useState(user.isVeteran ?? false);
  const [hasYoungChild, setHasYoungChild] = useState(user.hasYoungChild ?? false);

  // 일자리 선호
  const jp = user.jobPreferences;
  const [jobTypes, setJobTypes] = useState<JobActivityType[]>(jp?.preferredJobTypes ?? []);
  // 기존 저장값 → 15개 선택형(OCCUPATION_OPTS와 매칭되는 항목) + 자유 입력(나머지)
  const initOcc = jp?.pastOccupations ?? [];
  const [pastSelected, setPastSelected] = useState<string[]>(
    initOcc.filter((o) => OCCUPATION_OPTS.includes(o)),
  );
  const [pastExtra, setPastExtra] = useState<string>(
    initOcc.filter((o) => !OCCUPATION_OPTS.includes(o)).join(", "),
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(jp?.preferredTimeSlots ?? []);
  const [hourlyWage, setHourlyWage] = useState<number | null>(
    jp?.desiredHourlyWageKrw ?? null,
  );
  const [outdoorOk, setOutdoorOk] = useState(jp?.outdoorOk ?? false);
  const [walkingHeavyOk, setWalkingHeavyOk] = useState(jp?.walkingHeavyOk ?? true);
  const [drivingOk, setDrivingOk] = useState(jp?.drivingOk ?? false);

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const savePrefs = (patch: Partial<JobPreferences>) =>
    save({ jobPreferences: patch as JobPreferences });

  const save = async (payload: Partial<UserProfile>) => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "저장에 실패했어요.");
        setSaving(false);
        return;
      }
      // 저장된 필드를 홈으로 쿼리에 실어 보내 토스트("맞춤 추천 다시 계산됐어요") 노출.
      // router.refresh()로 홈의 SSR 매칭을 강제 재계산.
      router.refresh();
      router.push(`/?updated=${encodeURIComponent(field)}`);
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (field === "name") return save({ name });
    if (field === "birth") {
      if (!birthMonth) {
        setError("태어난 달을 골라 주세요.");
        return;
      }
      return save({ birthYear, birthMonth });
    }
    if (field === "region") return save({ region });
    if (field === "district") {
      if (!district.trim()) {
        setError("시·군·구를 입력해 주세요.");
        return;
      }
      return save({ district: district.trim() });
    }
    if (field === "household") return save({ household, householdSize });
    if (field === "income") return save({ monthlyIncomeKrw });
    if (field === "welfare") return save({ welfareStatus });
    if (field === "housing") return save({ housingType });
    if (field === "disability") {
      return save({
        hasDisability,
        disabilityGrade: hasDisability ? disabilityGrade : "none",
      });
    }
    if (field === "veteran") return save({ isVeteran });
    if (field === "youngChild") return save({ hasYoungChild });
    if (field === "jobTypes") return savePrefs({ preferredJobTypes: jobTypes });
    if (field === "pastOccupations") {
      // 선택형 15개 + 자유 입력 병합 (자유 입력 우선 dedupe)
      const extras = pastExtra
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const merged = Array.from(new Set([...pastSelected, ...extras]));
      return savePrefs({ pastOccupations: merged });
    }
    if (field === "timeSlots") {
      if (timeSlots.length === 0) {
        setError("선호 시간대를 하나 이상 골라 주세요.");
        return;
      }
      return savePrefs({ preferredTimeSlots: timeSlots });
    }
    if (field === "hourlyWage") return savePrefs({ desiredHourlyWageKrw: hourlyWage });
    if (field === "outdoor") return savePrefs({ outdoorOk });
    if (field === "walkingHeavy") return savePrefs({ walkingHeavyOk });
    if (field === "driving") return savePrefs({ drivingOk });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* 이름 */}
      {field === "name" && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[18px]"
        />
      )}

      {/* 출생 연·월 */}
      {field === "birth" && (
        <>
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
                    onClick={() => setBirthYear(y)}
                    className={`rounded-xl py-2 text-[15px] font-bold ${
                      birthYear === y
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
          <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
              태어난 달
            </h2>
            <div className="grid grid-cols-6 gap-1.5">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBirthMonth(m)}
                  className={`rounded-xl py-2 text-[14px] font-bold ${
                    birthMonth === m
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {m}월
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 시·도 */}
      {field === "region" && (
        <div className="grid grid-cols-3 gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`rounded-xl py-3 text-[13px] font-bold leading-tight ${
                region === r
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {r
                .replace("특별시", "")
                .replace("광역시", "")
                .replace("특별자치도", "")
                .replace("특별자치시", "")}
            </button>
          ))}
        </div>
      )}

      {/* 시·군·구 — 현재 region 기반 선택형 */}
      {field === "district" && (
        <>
          <p className="text-[13px] text-[var(--color-muted)]">
            현재 시·도: <span className="font-bold text-[var(--color-text)]">{user.region}</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {getDistricts(user.region).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setDistrict(g)}
                className={`rounded-xl py-3 text-[14px] font-bold ${
                  district === g
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-muted)]">
            시·도가 바뀌었다면 먼저 시·도부터 다시 수정해 주세요.
          </p>
        </>
      )}

      {/* 가구 */}
      {field === "household" && (
        <>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
              가구 형태
            </h2>
            <div className="flex flex-col gap-2">
              {HOUSEHOLD_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setHousehold(o.value)}
                  className={`rounded-2xl px-4 py-3 text-left text-[15px] font-bold ${
                    household === o.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
              가구원 수
            </h2>
            <input
              type="number"
              min={1}
              max={10}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-2 text-[18px]"
            />
          </section>
        </>
      )}

      {/* 월 소득 */}
      {field === "income" && (
        <>
          <input
            type="number"
            min={0}
            step={10000}
            value={monthlyIncomeKrw ?? ""}
            placeholder="예: 1500000"
            onChange={(e) => {
              const v = e.target.value;
              setMonthlyIncomeKrw(v === "" ? null : Number(v));
            }}
            className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[18px]"
          />
          <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
            가구 전체의 한 달 소득(공적연금·기초연금·근로소득 모두 합산)을 입력해 주세요.
          </p>
        </>
      )}

      {/* 복지 상태 */}
      {field === "welfare" && (
        <div className="flex flex-col gap-2">
          {WELFARE_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setWelfareStatus(o.value)}
              className={`rounded-2xl px-4 py-3 text-left text-[15px] font-bold ${
                welfareStatus === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* 주거 */}
      {field === "housing" && (
        <div className="grid grid-cols-2 gap-2">
          {HOUSING_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setHousingType(o.value)}
              className={`rounded-2xl px-3 py-4 text-[15px] font-bold ${
                housingType === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* 장애 */}
      {field === "disability" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHasDisability(true)}
              className={`rounded-2xl py-3 text-[15px] font-bold ${
                hasDisability
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              등록함
            </button>
            <button
              type="button"
              onClick={() => {
                setHasDisability(false);
                setDisabilityGrade("none");
              }}
              className={`rounded-2xl py-3 text-[15px] font-bold ${
                !hasDisability
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              등록 안 함
            </button>
          </div>
          {hasDisability && (
            <section className="rounded-2xl bg-white p-4">
              <h2 className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
                장애 등급
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {DISABILITY_GRADE_OPTS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setDisabilityGrade(o.value)}
                    className={`rounded-xl py-2.5 text-[13px] font-bold ${
                      disabilityGrade === o.value
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 국가유공자 */}
      {field === "veteran" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsVeteran(true)}
            className={`rounded-2xl py-4 text-[15px] font-bold ${
              isVeteran
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            네, 보훈대상자입니다
          </button>
          <button
            type="button"
            onClick={() => setIsVeteran(false)}
            className={`rounded-2xl py-4 text-[15px] font-bold ${
              !isVeteran
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            아니오
          </button>
        </div>
      )}

      {/* 영유아 */}
      {field === "youngChild" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setHasYoungChild(true)}
            className={`rounded-2xl py-4 text-[15px] font-bold ${
              hasYoungChild
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            네, 영유아 가구원이 있어요
          </button>
          <button
            type="button"
            onClick={() => setHasYoungChild(false)}
            className={`rounded-2xl py-4 text-[15px] font-bold ${
              !hasYoungChild
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
            }`}
          >
            아니오
          </button>
        </div>
      )}

      {/* 일자리 — 선호 활동 유형 */}
      {field === "jobTypes" && (
        <div className="flex flex-col gap-2">
          {JOB_TYPE_OPTS.map((o) => {
            const on = jobTypes.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setJobTypes(toggleArr(jobTypes, o.value))}
                className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                  on
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded border-2 ${
                    on
                      ? "border-white bg-white text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {on ? "✓" : ""}
                </span>
                <div>
                  <p className="text-[16px] font-bold">{o.label}</p>
                  <p
                    className={`text-[12px] ${
                      on ? "text-white/80" : "text-[var(--color-muted)]"
                    }`}
                  >
                    {o.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 일자리 — 이전 직종 (15개 선택형 + 자유 입력) */}
      {field === "pastOccupations" && (
        <>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-3 text-[15px] font-bold text-[var(--color-text)]">
              해당하는 분야를 골라주세요{" "}
              <span className="text-[12px] font-normal text-[var(--color-muted)]">
                (중복 선택)
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {OCCUPATION_OPTS.map((o) => {
                const on = pastSelected.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setPastSelected(toggleArr(pastSelected, o))
                    }
                    className={`rounded-xl py-2.5 text-[14px] font-bold ${
                      on
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="mb-2 text-[15px] font-bold text-[var(--color-text)]">
              기타 (직접 입력){" "}
              <span className="text-[12px] font-normal text-[var(--color-muted)]">
                쉼표로 구분 · 생략 가능
              </span>
            </h2>
            <textarea
              value={pastExtra}
              onChange={(e) => setPastExtra(e.target.value)}
              placeholder="예: 회계, 자동차정비"
              rows={2}
              className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
              maxLength={200}
            />
          </section>
        </>
      )}

      {/* 일자리 — 선호 시간대 */}
      {field === "timeSlots" && (
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOT_OPTS.map((o) => {
            const on = timeSlots.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setTimeSlots(toggleArr(timeSlots, o.value))}
                className={`rounded-2xl py-4 text-[15px] font-bold ${
                  on
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 일자리 — 희망 시급 */}
      {field === "hourlyWage" && (
        <>
          <input
            type="number"
            min={0}
            step={500}
            value={hourlyWage ?? ""}
            placeholder="예: 10000"
            onChange={(e) => {
              const v = e.target.value;
              setHourlyWage(v === "" ? null : Number(v));
            }}
            className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[18px]"
          />
          <button
            type="button"
            onClick={() => setHourlyWage(null)}
            className="text-[13px] font-semibold text-[var(--color-primary)]"
          >
            희망 시급 무관 (어떤 시급이든 OK)
          </button>
        </>
      )}

      {/* 일자리 — 야외/도보/운전 (boolean) */}
      {(field === "outdoor" || field === "walkingHeavy" || field === "driving") && (
        <div className="grid grid-cols-2 gap-2">
          {(() => {
            const cur =
              field === "outdoor"
                ? outdoorOk
                : field === "walkingHeavy"
                ? walkingHeavyOk
                : drivingOk;
            const setCur =
              field === "outdoor"
                ? setOutdoorOk
                : field === "walkingHeavy"
                ? setWalkingHeavyOk
                : setDrivingOk;
            const yesLabel =
              field === "outdoor"
                ? "야외 가능"
                : field === "walkingHeavy"
                ? "오래 걷기 가능"
                : "운전 가능";
            const noLabel =
              field === "outdoor"
                ? "야외는 어려움"
                : field === "walkingHeavy"
                ? "오래 걷기 어려움"
                : "운전 안 함";
            return (
              <>
                <button
                  type="button"
                  onClick={() => setCur(true)}
                  className={`rounded-2xl py-4 text-[15px] font-bold ${
                    cur
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {yesLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setCur(false)}
                  className={`rounded-2xl py-4 text-[15px] font-bold ${
                    !cur
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {noLabel}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-[18px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}
