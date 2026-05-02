"use client";

// 시니어 일자리 매칭 보고서 §5.1 — 4단계 온보딩
// 각 단계 30초 이내 · 큰 버튼 · 진행 표시
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = 0 | 1 | 2 | 3 | 4 | "saving" | "done";

interface OnboardingState {
  name: string;
  birthYear: number | null;
  region: string | null;
  district: string | null;
  household: "single" | "couple" | "with_family" | null;
  monthlyIncomeKrw: number | null;
  outdoorOk: boolean | null;
  walkingHeavyOk: boolean | null;
  daysPerWeek: number | null;
  preferredJobTypes: string[];
  pastOccupations: string[];
  desiredHourlyWageKrw: number | null;
  preferredTimeSlots: string[];
}

const REGIONS = [
  "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "강원특별자치도", "충청북도", "충청남도", "전북특별자치도",
  "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

// 서울시 25개 자치구 — 가나다 순
const SEOUL_GU = [
  "강남구", "강동구", "강북구", "강서구",
  "관악구", "광진구", "구로구", "금천구",
  "노원구",
  "도봉구", "동대문구", "동작구",
  "마포구",
  "서대문구", "서초구", "성동구", "성북구", "송파구",
  "양천구", "영등포구", "용산구", "은평구",
  "종로구", "중구", "중랑구",
];

const JOB_TYPES = [
  { v: "공익활동형", desc: "공원·환경·안전" },
  { v: "사회서비스형", desc: "돌봄·교육·복지" },
  { v: "시장형", desc: "공방·매장·물류" },
];

const OCCUPATIONS = [
  "교육", "사무·행정", "주방·식당", "보육·돌봄",
  "운수·교통", "환경·청소", "공방·수공예", "응대·안내",
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState<string | null>(null);
  const [s, setS] = useState<OnboardingState>({
    name: "",
    birthYear: null,
    region: null,
    district: null,
    household: null,
    monthlyIncomeKrw: null,
    outdoorOk: null,
    walkingHeavyOk: null,
    daysPerWeek: null,
    preferredJobTypes: [],
    pastOccupations: [],
    desiredHourlyWageKrw: null,
    preferredTimeSlots: [],
  });

  const goNext = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const toggle = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const submit = async () => {
    setStep("saving");
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          birthYear: s.birthYear,
          region: s.region,
          district: s.district,
          household: s.household ?? "single",
          householdSize: s.household === "couple" ? 2 : s.household === "with_family" ? 3 : 1,
          monthlyIncomeKrw: s.monthlyIncomeKrw,
          outdoorOk: s.outdoorOk ?? false,
          walkingHeavyOk: s.walkingHeavyOk ?? true,
          daysPerWeek: s.daysPerWeek,
          preferredJobTypes: s.preferredJobTypes,
          pastOccupations: s.pastOccupations,
          preferredTimeSlots: s.preferredTimeSlots,
          desiredHourlyWageKrw: s.desiredHourlyWageKrw,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "저장에 실패했어요. 잠시 후 다시 시도해주세요.");
        setStep(4);
        return;
      }
      setStep("done");
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해주세요.");
      setStep(4);
    }
  };

  const yearOptions = (() => {
    const yrs = [];
    for (let y = 1965; y >= 1935; y -= 5) yrs.push(y);
    return yrs;
  })();

  if (step === "saving") {
    return (
      <div className="mx-auto max-w-[420px] py-12 text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        <p className="text-[16px] font-semibold text-[var(--color-muted)]">
          답변을 분석하고 받으실 수 있는 혜택을 찾고 있어요...
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-[420px] py-10 text-center">
        <div className="mb-6 text-6xl">🎉</div>
        <h2 className="mb-3 text-[24px] font-extrabold text-[var(--color-text)]">
          준비가 끝났어요!
        </h2>
        <p className="mb-8 text-[16px] leading-relaxed text-[var(--color-muted)]">
          입력해주신 정보를 바탕으로 맞춤 혜택과 일자리를 찾아드릴게요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-primary inline-block rounded-2xl px-8 py-4 text-[17px] font-bold"
        >
          내 맞춤 혜택 보러가기 →
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 진행 표시 (1~4단계만 표시, 0은 인트로라서 제외) */}
      {typeof step === "number" && step >= 1 && step <= 4 && (
        <div className="mb-6">
          <p className="mb-2 text-center text-[14px] font-bold text-[var(--color-muted)]">
            {step}단계 / 4단계
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-2 flex-1 rounded-full ${
                  n <= (step as number)
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 0 — 인사말 + 약관 안내 */}
      {step === 0 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 text-center card-soft">
            <div className="text-5xl">👋</div>
            <h2 className="mt-3 text-[22px] font-extrabold text-[var(--color-text)]">
              어르신만의 맞춤 혜택을 찾아드릴게요
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
              4가지 질문에 답해주시면 받으실 수 있는 복지·일자리·이웃을 자동으로 매칭해드려요.
              <br />
              1분이면 끝나요.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <p className="mb-2 text-[14px] font-bold text-[var(--color-text)]">
              어떻게 부르면 될까요? <span className="text-[var(--color-muted)]">(생략 가능)</span>
            </p>
            <input
              type="text"
              value={s.name}
              onChange={(e) => setS({ ...s, name: e.target.value })}
              placeholder="예: 김정숙"
              className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[18px]"
              maxLength={20}
            />
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-soft-blue)] p-4">
            <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
              <span className="font-bold text-[var(--color-text)]">개인정보 안내</span>
              <br />
              입력하시는 정보는 혜택·일자리 매칭에만 사용되며, 안전하게 보관돼요. 동의하시면 시작 버튼을 눌러주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => goNext(1)}
            className="btn-primary rounded-2xl py-5 text-[19px] font-bold"
          >
            동의하고 시작하기 →
          </button>
        </div>
      )}

      {/* STEP 1 — 기본 조건 */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-[22px] font-extrabold text-[var(--color-text)]">
            출생 연도를 알려주세요
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {yearOptions.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setS({ ...s, birthYear: y })}
                className={`rounded-2xl py-4 text-[18px] font-bold ${
                  s.birthYear === y
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {y}년대
              </button>
            ))}
          </div>

          <div className="mt-2 rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--bg-soft-blue)] p-4">
            <h2 className="text-[20px] font-extrabold text-[var(--color-text)]">
              📍 거주 지역
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              혜택·일자리·이웃 매칭의 핵심이에요. 시·도와 시·군·구를 모두 골라주세요.
            </p>

            <p className="mt-4 mb-2 text-[14px] font-bold text-[var(--color-text)]">
              1) 시·도 (전체 17개)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setS({ ...s, region: r, district: null })}
                  className={`rounded-xl py-2 text-[12px] font-bold leading-tight ${
                    s.region === r
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {r.replace("특별시", "").replace("광역시", "").replace("특별자치도", "").replace("특별자치시", "")}
                </button>
              ))}
            </div>

            {s.region === "서울특별시" && (
              <>
                <p className="mt-4 mb-2 text-[14px] font-bold text-[var(--color-text)]">
                  2) 자치구 ← <span className="text-[var(--color-urgent)]">선택 필수</span>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEOUL_GU.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setS({ ...s, district: g })}
                      className={`rounded-lg py-2 text-[12px] font-semibold ${
                        s.district === g
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </>
            )}

            {s.region && s.region !== "서울특별시" && (
              <div className="mt-4 rounded-xl bg-white p-3">
                <p className="text-[14px] font-bold text-[var(--color-text)]">
                  2) 시·군·구 직접 입력
                </p>
                <input
                  type="text"
                  placeholder="예: 수원시 영통구"
                  value={s.district ?? ""}
                  onChange={(e) => setS({ ...s, district: e.target.value })}
                  className="mt-2 w-full rounded-lg border-2 border-[var(--color-border)] bg-white px-3 py-2 text-[15px]"
                />
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  💡 서울 외 지역은 텍스트로 입력해주세요. 카카오 지도가 자동 좌표 변환합니다.
                </p>
              </div>
            )}

            {s.region && (
              <p className="mt-3 text-[13px] font-bold text-[var(--color-success)]">
                ✓ {s.region} {s.district ?? "(시·군·구 선택해주세요)"}
              </p>
            )}
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            가구 형태
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "single", l: "혼자 살아요", icon: "🧓" },
              { v: "couple", l: "부부예요", icon: "👫" },
              { v: "with_family", l: "가족과 함께", icon: "👨‍👩‍👧" },
            ].map((h) => (
              <button
                key={h.v}
                type="button"
                onClick={() => setS({ ...s, household: h.v as "single" | "couple" | "with_family" })}
                className={`rounded-2xl py-4 ${
                  s.household === h.v
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <div className="text-2xl">{h.icon}</div>
                <p className="mt-1 text-[14px] font-bold">{h.l}</p>
              </button>
            ))}
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            한 달 <span className="text-[var(--color-primary)]">가구 전체</span> 소득
          </h2>
          <div className="rounded-xl bg-[var(--bg-soft-yellow)] border border-[var(--color-accent)]/40 p-3">
            <p className="text-[13px] leading-relaxed text-[var(--color-text)]">
              <span className="font-bold">⚠ 중요:</span>{" "}
              {s.household === "single"
                ? "혼자 사시니 본인 한 달 소득을 적어주세요."
                : s.household === "couple"
                ? "부부 두 분의 한 달 소득을 모두 합산한 금액이에요."
                : s.household === "with_family"
                ? "함께 사시는 가족 전원의 한 달 소득을 모두 합산한 금액이에요."
                : "가구 전체(본인+배우자+가족) 한 달 소득을 모두 합산한 금액이에요."}
              <br />
              <span className="text-[var(--color-muted)]">대략적으로 OK · 생략 가능</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 500_000, l: "50만원 이하" },
              { v: 1_000_000, l: "약 100만원" },
              { v: 1_500_000, l: "약 150만원" },
              { v: 2_000_000, l: "약 200만원" },
              { v: 3_000_000, l: "약 300만원" },
              { v: 4_000_000, l: "약 400만원" },
              { v: 5_000_000, l: "약 500만원" },
              { v: null, l: "잘 모르겠어요" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setS({ ...s, monthlyIncomeKrw: opt.v })}
                className={`rounded-xl py-3 text-[15px] font-bold ${
                  s.monthlyIncomeKrw === opt.v
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goNext(2)}
            disabled={
              !s.birthYear ||
              !s.region ||
              !s.district ||
              !s.district.trim() ||
              !s.household
            }
            className="btn-primary mt-6 rounded-2xl py-4 text-[17px] font-bold disabled:opacity-40"
          >
            다음 →
          </button>
          {(!s.district || !s.district.trim()) && s.region && (
            <p className="mt-1 text-center text-[13px] text-[var(--color-urgent)]">
              ⚠ 시·군·구까지 입력하시면 다음으로 갈 수 있어요
            </p>
          )}
        </div>
      )}

      {/* STEP 2 — 활동 조건 */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-[22px] font-extrabold text-[var(--color-text)]">
            야외 활동도 괜찮으세요?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setS({ ...s, outdoorOk: true })}
              className={`rounded-2xl py-5 text-[18px] font-bold ${
                s.outdoorOk === true
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              👍 좋아요
            </button>
            <button
              onClick={() => setS({ ...s, outdoorOk: false })}
              className={`rounded-2xl py-5 text-[18px] font-bold ${
                s.outdoorOk === false
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              실내가 편해요
            </button>
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            걷기는 어떠세요?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setS({ ...s, walkingHeavyOk: true })}
              className={`rounded-2xl py-5 text-[18px] font-bold ${
                s.walkingHeavyOk === true
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              많이 걸어도 OK
            </button>
            <button
              onClick={() => setS({ ...s, walkingHeavyOk: false })}
              className={`rounded-2xl py-5 text-[18px] font-bold ${
                s.walkingHeavyOk === false
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              앉아서 하는 일
            </button>
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            주 몇 회 일하고 싶으세요?
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setS({ ...s, daysPerWeek: n })}
                className={`rounded-2xl py-4 text-[18px] font-bold ${
                  s.daysPerWeek === n
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {n}일
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => goNext(1)}
              className="flex-1 rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[17px] font-bold text-[var(--color-text)]"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={() => goNext(3)}
              disabled={
                s.outdoorOk === null ||
                s.walkingHeavyOk === null ||
                s.daysPerWeek === null
              }
              className="flex-1 rounded-2xl bg-[var(--color-primary)] py-4 text-[17px] font-bold text-white disabled:opacity-40"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — 경력·관심사 */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-[22px] font-extrabold text-[var(--color-text)]">
            관심 있는 일자리 종류
          </h2>
          <p className="text-[14px] text-[var(--color-muted)]">
            여러 개 골라도 좋아요 (최대 3개)
          </p>
          <div className="flex flex-col gap-2">
            {JOB_TYPES.map((j) => (
              <button
                key={j.v}
                type="button"
                onClick={() =>
                  setS({
                    ...s,
                    preferredJobTypes: toggle(s.preferredJobTypes, j.v).slice(0, 3),
                  })
                }
                className={`rounded-2xl px-5 py-4 text-left ${
                  s.preferredJobTypes.includes(j.v)
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <p className="text-[18px] font-bold">{j.v}</p>
                <p
                  className={`text-[14px] ${
                    s.preferredJobTypes.includes(j.v)
                      ? "text-white/80"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {j.desc}
                </p>
              </button>
            ))}
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            경험해보신 분야
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {OCCUPATIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() =>
                  setS({ ...s, pastOccupations: toggle(s.pastOccupations, o) })
                }
                className={`rounded-xl py-3 text-[15px] font-bold ${
                  s.pastOccupations.includes(o)
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => goNext(2)}
              className="flex-1 rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[17px] font-bold text-[var(--color-text)]"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={() => goNext(4)}
              disabled={s.preferredJobTypes.length === 0}
              className="flex-1 rounded-2xl bg-[var(--color-primary)] py-4 text-[17px] font-bold text-white disabled:opacity-40"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — 희망 조건 */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-[22px] font-extrabold text-[var(--color-text)]">
            희망 시급
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[9620, 10500, 12000, 13000, 15000, 0].map((w) => (
              <button
                key={w}
                onClick={() => setS({ ...s, desiredHourlyWageKrw: w === 0 ? null : w })}
                className={`rounded-2xl py-4 text-[16px] font-bold ${
                  (w === 0 && s.desiredHourlyWageKrw === null) ||
                  (w !== 0 && s.desiredHourlyWageKrw === w)
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {w === 0 ? "상관없어요" : `${w.toLocaleString()}원~`}
              </button>
            ))}
          </div>

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            선호 시간대
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "morning", l: "오전", icon: "🌅" },
              { v: "afternoon", l: "오후", icon: "☀️" },
              { v: "evening", l: "저녁", icon: "🌙" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() =>
                  setS({
                    ...s,
                    preferredTimeSlots: toggle(s.preferredTimeSlots, t.v),
                  })
                }
                className={`rounded-2xl py-4 ${
                  s.preferredTimeSlots.includes(t.v)
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <div className="text-2xl">{t.icon}</div>
                <p className="mt-1 text-[15px] font-bold">{t.l}</p>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => goNext(3)}
              className="flex-1 rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[17px] font-bold text-[var(--color-text)]"
            >
              ← 이전
            </button>
            <button
              type="button"
              onClick={submit}
              className="btn-primary flex-1 rounded-2xl py-4 text-[17px] font-bold"
            >
              완료 ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
