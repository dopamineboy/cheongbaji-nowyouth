"use client";

// MVP 개선 의견 수집 설문 — 4 step 다단계 폼 (시니어 친화)
// Step 1 기본 정보 → 2 전체 평가 → 3 화면별 → 4 페인포인트·자유 의견
import { useState } from "react";
import type {
  SurveyAgeBand,
  SurveyDevice,
  SurveyPainPoint,
  SurveyUsagePeriod,
} from "../lib/types";

// ─── 선택지 정의 ──────────────────────────────────────────────

const AGE_OPTIONS: { value: SurveyAgeBand; label: string }[] = [
  { value: "60-64", label: "60~64세" },
  { value: "65-69", label: "65~69세" },
  { value: "70-74", label: "70~74세" },
  { value: "75-79", label: "75~79세" },
  { value: "80+", label: "80세 이상" },
  { value: "prefer_not", label: "답하지 않을게요" },
];

const USAGE_OPTIONS: { value: SurveyUsagePeriod; label: string; desc: string }[] = [
  { value: "first", label: "오늘 처음 써봐요", desc: "방금 시작" },
  { value: "days", label: "며칠 됐어요", desc: "1~6일" },
  { value: "weeks", label: "1주~1달 됐어요", desc: "꽤 익숙해진 편" },
  { value: "month_plus", label: "1달 넘게 쓰고 있어요", desc: "오래 사용" },
];

const DEVICE_OPTIONS: { value: SurveyDevice; label: string; icon: string }[] = [
  { value: "phone", label: "스마트폰", icon: "📱" },
  { value: "tablet", label: "태블릿", icon: "🟦" },
  { value: "pc", label: "PC·노트북", icon: "💻" },
];

const SAT_OPTIONS = [
  { score: 1, label: "별로예요", emoji: "😞" },
  { score: 2, label: "그저 그래요", emoji: "😐" },
  { score: 3, label: "보통이에요", emoji: "🙂" },
  { score: 4, label: "좋아요", emoji: "😊" },
  { score: 5, label: "아주 좋아요", emoji: "🤩" },
];

const SCREENS: { key: ScoreKey; label: string; desc: string }[] = [
  { key: "scoreWelfare", label: "복지 알리미", desc: "맞춤 복지 추천" },
  { key: "scoreJobs", label: "일자리 매칭", desc: "내게 맞는 일자리" },
  { key: "scoreActivity", label: "활동·미션", desc: "포인트, 학습 퀴즈" },
  { key: "scoreCommunity", label: "커뮤니티", desc: "이웃 도움 요청" },
];

type ScoreKey =
  | "scoreWelfare"
  | "scoreJobs"
  | "scoreActivity"
  | "scoreCommunity";

const PAIN_POINT_OPTIONS: { value: SurveyPainPoint; label: string; icon: string }[] = [
  { value: "font_small", label: "글자가 작아요", icon: "🔍" },
  { value: "slow_loading", label: "속도·로딩이 느려요", icon: "⏳" },
  { value: "button_layout", label: "버튼·메뉴 위치가 헷갈려요", icon: "🧭" },
  { value: "guide_unclear", label: "안내가 부족해요", icon: "❓" },
  { value: "accuracy", label: "정보가 부정확해요", icon: "⚠️" },
  { value: "voice_needed", label: "음성 기능이 필요해요", icon: "🎤" },
  { value: "other", label: "기타", icon: "✨" },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export default function SurveyForm() {
  const [step, setStep] = useState(1); // 1~4 진행, 5 = 완료
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 답변 상태
  const [ageBand, setAgeBand] = useState<SurveyAgeBand | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<SurveyUsagePeriod | null>(null);
  const [device, setDevice] = useState<SurveyDevice | undefined>(undefined);

  const [nps, setNps] = useState<number | null>(null);
  const [sat, setSat] = useState<number | null>(null);

  const [scoreWelfare, setScoreWelfare] = useState<number | null | undefined>(undefined);
  const [scoreJobs, setScoreJobs] = useState<number | null | undefined>(undefined);
  const [scoreActivity, setScoreActivity] = useState<number | null | undefined>(undefined);
  const [scoreCommunity, setScoreCommunity] = useState<number | null | undefined>(undefined);

  const [painPoints, setPainPoints] = useState<SurveyPainPoint[]>([]);
  const [painPointDetail, setPainPointDetail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");

  const togglePain = (p: SurveyPainPoint) => {
    setPainPoints((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  // 각 step 진행 가능 여부
  const canNext = (): boolean => {
    if (step === 1) return ageBand !== null && usagePeriod !== null;
    if (step === 2) return nps !== null && sat !== null;
    if (step === 3) {
      // 모든 화면 점수가 결정돼야 함 (1~5 또는 명시적 null = "사용 안 했어요")
      return (
        scoreWelfare !== undefined &&
        scoreJobs !== undefined &&
        scoreActivity !== undefined &&
        scoreCommunity !== undefined
      );
    }
    if (step === 4) {
      return painPoints.length > 0 || feedback.trim().length > 0;
    }
    return false;
  };

  const goNext = () => {
    setError(null);
    if (!canNext()) {
      setError("이 단계의 답변을 골라 주세요.");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submit();
    }
  };

  const goPrev = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageBand,
          usagePeriod,
          device,
          nps,
          overallSatisfaction: sat,
          scoreWelfare: scoreWelfare === undefined ? null : scoreWelfare,
          scoreJobs: scoreJobs === undefined ? null : scoreJobs,
          scoreActivity: scoreActivity === undefined ? null : scoreActivity,
          scoreCommunity: scoreCommunity === undefined ? null : scoreCommunity,
          painPoints,
          painPointDetail,
          freeFeedback: feedback,
          contactEmail: email,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "전송에 실패했어요.");
        setSubmitting(false);
        return;
      }
      setStep(5);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  if (step === 5) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center">
        <p className="text-5xl" aria-hidden>
          🙏
        </p>
        <h2 className="mt-3 text-[22px] font-extrabold text-[var(--color-text)]">
          소중한 의견 감사합니다
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">
          답해 주신 내용은 청바지 팀이 직접 읽고 다음 업데이트에 반영합니다.
        </p>
      </div>
    );
  }

  const stepTitle =
    step === 1 ? "기본 정보" :
    step === 2 ? "전체 평가" :
    step === 3 ? "화면별 평가" : "마지막 한 마디";

  const stepHint =
    step === 1 ? "30초" :
    step === 2 ? "30초" :
    step === 3 ? "1분" : "1분";

  return (
    <div className="flex flex-col gap-6">
      {/* 진행률 + step 라벨 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[15px] font-bold text-[var(--color-text)]">
            {step}/4 · {stepTitle}
          </p>
          <p className="text-[13px] text-[var(--color-muted)]">{stepHint}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <Step1
          ageBand={ageBand}
          setAgeBand={setAgeBand}
          usagePeriod={usagePeriod}
          setUsagePeriod={setUsagePeriod}
          device={device}
          setDevice={setDevice}
        />
      )}
      {step === 2 && (
        <Step2 nps={nps} setNps={setNps} sat={sat} setSat={setSat} />
      )}
      {step === 3 && (
        <Step3
          scoreWelfare={scoreWelfare}
          setScoreWelfare={setScoreWelfare}
          scoreJobs={scoreJobs}
          setScoreJobs={setScoreJobs}
          scoreActivity={scoreActivity}
          setScoreActivity={setScoreActivity}
          scoreCommunity={scoreCommunity}
          setScoreCommunity={setScoreCommunity}
        />
      )}
      {step === 4 && (
        <Step4
          painPoints={painPoints}
          togglePain={togglePain}
          painPointDetail={painPointDetail}
          setPainPointDetail={setPainPointDetail}
          feedback={feedback}
          setFeedback={setFeedback}
          email={email}
          setEmail={setEmail}
        />
      )}

      {error && (
        <p className="rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={goPrev}
            disabled={submitting}
            className="flex-1 rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[16px] font-bold text-[var(--color-text)] disabled:opacity-50"
          >
            ← 이전
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={submitting || !canNext()}
          className="flex-[2] rounded-2xl bg-[var(--color-primary)] py-4 text-[18px] font-bold text-white disabled:opacity-50"
        >
          {step < 4 ? "다음 →" : submitting ? "보내는 중..." : "의견 보내기"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: 기본 정보 ──────────────────────────────────────────

function Step1({
  ageBand,
  setAgeBand,
  usagePeriod,
  setUsagePeriod,
  device,
  setDevice,
}: {
  ageBand: SurveyAgeBand | null;
  setAgeBand: (v: SurveyAgeBand) => void;
  usagePeriod: SurveyUsagePeriod | null;
  setUsagePeriod: (v: SurveyUsagePeriod) => void;
  device: SurveyDevice | undefined;
  setDevice: (v: SurveyDevice | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Q1 연령대 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          1. 연령대를 알려 주세요
        </label>
        <div className="grid grid-cols-2 gap-2">
          {AGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setAgeBand(o.value)}
              className={`rounded-2xl py-4 text-[16px] font-bold transition ${
                ageBand === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Q2 사용 기간 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          2. 청바지를 얼마나 써 보셨나요?
        </label>
        <div className="flex flex-col gap-2">
          {USAGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setUsagePeriod(o.value)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                usagePeriod === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <span className="text-[16px] font-bold">{o.label}</span>
              <span
                className={`text-[12px] ${
                  usagePeriod === o.value
                    ? "text-white/80"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {o.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Q3 기기 (선택) */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          3. 주로 어떤 기기로 쓰세요?{" "}
          <span className="text-[13px] font-normal text-[var(--color-muted)]">
            (선택)
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DEVICE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDevice(device === o.value ? undefined : o.value)}
              className={`rounded-2xl py-3 text-center transition ${
                device === o.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <div className="text-2xl" aria-hidden>
                {o.icon}
              </div>
              <p className="mt-1 text-[13px] font-semibold">{o.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: 전체 평가 (NPS + 만족도) ──────────────────────────

function Step2({
  nps,
  setNps,
  sat,
  setSat,
}: {
  nps: number | null;
  setNps: (v: number) => void;
  sat: number | null;
  setSat: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Q4 NPS */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          4. 친구·이웃에게 청바지를 추천하시겠어요?
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNps(n)}
              className={`aspect-square rounded-xl text-[18px] font-bold transition ${
                nps === n
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-[var(--color-muted)]">
          <span>0 · 추천 어려워요</span>
          <span>10 · 꼭 추천해요</span>
        </div>
      </div>

      {/* Q5 만족도 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          5. 청바지 사용해 보시니 전체적으로 어떠셨나요?
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {SAT_OPTIONS.map((o) => (
            <button
              key={o.score}
              type="button"
              onClick={() => setSat(o.score)}
              className={`rounded-xl p-2 text-center transition ${
                sat === o.score
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <div className="text-2xl" aria-hidden>
                {o.emoji}
              </div>
              <p className="mt-0.5 text-[11px] font-semibold leading-tight">
                {o.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: 화면별 만족도 ────────────────────────────────────

function Step3(props: {
  scoreWelfare: number | null | undefined;
  setScoreWelfare: (v: number | null) => void;
  scoreJobs: number | null | undefined;
  setScoreJobs: (v: number | null) => void;
  scoreActivity: number | null | undefined;
  setScoreActivity: (v: number | null) => void;
  scoreCommunity: number | null | undefined;
  setScoreCommunity: (v: number | null) => void;
}) {
  const setterFor: Record<ScoreKey, (v: number | null) => void> = {
    scoreWelfare: props.setScoreWelfare,
    scoreJobs: props.setScoreJobs,
    scoreActivity: props.setScoreActivity,
    scoreCommunity: props.setScoreCommunity,
  };
  const valueFor: Record<ScoreKey, number | null | undefined> = {
    scoreWelfare: props.scoreWelfare,
    scoreJobs: props.scoreJobs,
    scoreActivity: props.scoreActivity,
    scoreCommunity: props.scoreCommunity,
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
        각 화면이 도움이 됐는지 점수로 알려 주세요. 안 써본 화면은
        &quot;사용 안 했어요&quot;를 골라 주시면 됩니다.
      </p>
      {SCREENS.map((s) => {
        const v = valueFor[s.key];
        const set = setterFor[s.key];
        return (
          <div
            key={s.key}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[16px] font-bold text-[var(--color-text)]">
                {s.label}
              </p>
              <p className="text-[12px] text-[var(--color-muted)]">{s.desc}</p>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set(n)}
                  className={`aspect-square rounded-lg text-[15px] font-bold transition ${
                    v === n
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set(null)}
              className={`mt-2 w-full rounded-lg py-2 text-[13px] font-semibold transition ${
                v === null
                  ? "bg-[var(--color-muted)]/15 text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10"
              }`}
            >
              사용 안 했어요
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 4: 페인포인트 + 자유 의견 ───────────────────────────

function Step4({
  painPoints,
  togglePain,
  painPointDetail,
  setPainPointDetail,
  feedback,
  setFeedback,
  email,
  setEmail,
}: {
  painPoints: SurveyPainPoint[];
  togglePain: (p: SurveyPainPoint) => void;
  painPointDetail: string;
  setPainPointDetail: (v: string) => void;
  feedback: string;
  setFeedback: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Q10 페인포인트 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          10. 어떤 점이 가장 아쉬웠나요?{" "}
          <span className="text-[13px] font-normal text-[var(--color-muted)]">
            (여러 개 선택 가능)
          </span>
        </label>
        <div className="flex flex-col gap-2">
          {PAIN_POINT_OPTIONS.map((o) => {
            const on = painPoints.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => togglePain(o.value)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
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
                <span className="text-2xl" aria-hidden>
                  {o.icon}
                </span>
                <span className="text-[16px] font-bold">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Q11 페인포인트 디테일 */}
      <div>
        <label
          htmlFor="painDetail"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          11. 자세히 알려 주세요{" "}
          <span className="text-[13px] font-normal text-[var(--color-muted)]">
            (선택)
          </span>
        </label>
        <textarea
          id="painDetail"
          value={painPointDetail}
          onChange={(e) => setPainPointDetail(e.target.value)}
          placeholder="예: 일자리 검색이 너무 느리고, 결과 글자가 작아 잘 안 보였어요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={3}
          maxLength={300}
        />
      </div>

      {/* Q12 자유 의견 */}
      <div>
        <label
          htmlFor="feedback"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          12. 청바지 팀에 꼭 전하고 싶은 한마디
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="자유롭게 적어 주세요. 한 줄이라도 좋아요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={4}
          maxLength={500}
        />
      </div>

      {/* 이메일 (선택) */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-[15px] font-bold text-[var(--color-text)]"
        >
          연락받을 이메일{" "}
          <span className="text-[13px] font-normal text-[var(--color-muted)]">
            (선택)
          </span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="답변에 회신이 필요할 때만 사용해요"
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          maxLength={120}
        />
      </div>
    </div>
  );
}
