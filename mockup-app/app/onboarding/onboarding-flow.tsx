"use client";

// 시니어 일자리 매칭 보고서 §5.1 — 4단계 온보딩
// 각 단계 30초 이내 · 큰 버튼 · 진행 표시
import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | "done";

interface OnboardingState {
  birthYear: number | null;
  region: string | null;
  district: string | null;
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

const SEOUL_GU = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
  "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
  "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
  "서초구", "강남구", "송파구", "강동구",
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
  const [step, setStep] = useState<Step>(1);
  const [s, setS] = useState<OnboardingState>({
    birthYear: null,
    region: null,
    district: null,
    outdoorOk: null,
    walkingHeavyOk: null,
    daysPerWeek: null,
    preferredJobTypes: [],
    pastOccupations: [],
    desiredHourlyWageKrw: null,
    preferredTimeSlots: [],
  });

  const goNext = (next: Step) => setStep(next);

  const toggle = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const yearOptions = (() => {
    const yrs = [];
    for (let y = 1965; y >= 1935; y -= 5) yrs.push(y);
    return yrs;
  })();

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
        <Link
          href="/"
          className="inline-block rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-[17px] font-bold text-white"
        >
          홈으로 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 진행 표시 */}
      <div className="mb-6">
        <p className="mb-2 text-center text-[14px] font-bold text-[var(--color-muted)]">
          {step}단계 / 4단계
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-2 flex-1 rounded-full ${
                n <= step ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
              }`}
            />
          ))}
        </div>
      </div>

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

          <h2 className="mt-4 text-[20px] font-extrabold text-[var(--color-text)]">
            거주하시는 시·도
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.slice(0, 6).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setS({ ...s, region: r, district: null })}
                className={`rounded-2xl py-3 text-[16px] font-bold ${
                  s.region === r
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {s.region === "서울특별시" && (
            <>
              <p className="mt-2 text-[15px] font-bold text-[var(--color-text)]">
                자치구
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SEOUL_GU.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setS({ ...s, district: g })}
                    className={`rounded-xl py-2 text-[14px] font-semibold ${
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

          <button
            type="button"
            onClick={() => goNext(2)}
            disabled={!s.birthYear || !s.region}
            className="mt-6 rounded-2xl bg-[var(--color-primary)] py-4 text-[17px] font-bold text-white disabled:opacity-40"
          >
            다음 →
          </button>
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
              onClick={() => goNext("done")}
              className="flex-1 rounded-2xl bg-[var(--color-primary)] py-4 text-[17px] font-bold text-white"
            >
              완료 ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
