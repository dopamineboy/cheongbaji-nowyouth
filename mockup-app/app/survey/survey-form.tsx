"use client";

// 앱 사용 설문 — 객관식 10문항(① ② ③ + 기타) + 서술 3문항
// 3 step 다단계 폼 (시니어 친화)
//   Step 1: Q1~Q5  (5문항)
//   Step 2: Q6~Q10 (5문항)
//   Step 3: Q11~Q13 + 이메일(선택)
import { useState } from "react";
import {
  SURVEY_CHOICE_KEYS,
  type SurveyChoice,
  type SurveyChoiceKey,
  type SurveyQuestionAnswer,
} from "../lib/types";

// ─── 문항 정의 ─────────────────────────────────────────────────

interface QuestionDef {
  key: SurveyChoiceKey;
  label: string;
  options: [string, string, string]; // ①, ②, ③ 라벨
}

const QUESTIONS: QuestionDef[] = [
  { key: "q1_ease",          label: "1. 이 앱은 사용하기 쉬웠나요?",                       options: ["매우 쉬움",    "보통", "어려움"] },
  { key: "q2_understanding", label: "2. 이 앱이 무엇을 하는 앱인지 이해되셨나요?",          options: ["잘 이해됨",    "조금 헷갈림", "전혀 모르겠음"] },
  { key: "q3_findFeature",   label: "3. 원하는 기능을 찾기 쉬웠나요?",                     options: ["매우 쉬움",    "보통", "어려움"] },
  { key: "q4_confusion",     label: "4. 어디를 눌러야 할지 헷갈린 적 있었나요?",            options: ["전혀 없음",    "가끔 있음", "자주 있음"] },
  { key: "q5_readability",   label: "5. 글씨 크기와 화면은 보기 편했나요?",                options: ["매우 편함",    "보통", "불편함"] },
  { key: "q6_buttons",       label: "6. 버튼(누르는 부분)은 누르기 쉬웠나요?",             options: ["매우 쉬움",    "보통", "어려움"] },
  { key: "q7_mistakes",      label: "7. 사용 중 실수로 잘못 누른 적이 있었나요?",          options: ["없음",         "가끔 있음", "자주 있음"] },
  { key: "q8_selfUse",       label: "8. 혼자서 다시 사용할 수 있을 것 같나요?",            options: ["충분히 가능",  "조금 어려움", "거의 불가능"] },
  { key: "q9_satisfaction",  label: "9. 전반적인 만족도는 어떠신가요?",                    options: ["매우 만족",    "보통", "불만족"] },
  { key: "q10_continue",     label: "10. 계속 사용할 의향이 있으신가요?",                  options: ["있음",         "고민됨", "없음"] },
];

const STEP_RANGES: { from: number; to: number }[] = [
  { from: 0, to: 4 },  // Q1-Q5
  { from: 5, to: 9 },  // Q6-Q10
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export default function SurveyForm() {
  const [step, setStep] = useState(1); // 1~3 진행, 4 = 완료
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState<
    Partial<Record<SurveyChoiceKey, SurveyQuestionAnswer>>
  >({});

  // "기타" 입력란이 열려 있는 문항 키
  const [etcOpen, setEtcOpen] = useState<Set<SurveyChoiceKey>>(new Set());

  const [q11, setQ11] = useState("");
  const [q12, setQ12] = useState("");
  const [q13, setQ13] = useState("");
  const [email, setEmail] = useState("");

  const setChoice = (key: SurveyChoiceKey, choice: SurveyChoice) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: { choice, etc: prev[key]?.etc },
    }));
  };

  const setEtc = (key: SurveyChoiceKey, etc: string) => {
    setAnswers((prev) => {
      const cur = prev[key];
      if (!cur) return prev; // 기타만 적고 선택 안 한 경우는 무시
      return { ...prev, [key]: { ...cur, etc } };
    });
  };

  const toggleEtc = (key: SurveyChoiceKey) => {
    setEtcOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const stepQuestions = (s: number): QuestionDef[] => {
    if (s === 1) return QUESTIONS.slice(STEP_RANGES[0].from, STEP_RANGES[0].to + 1);
    if (s === 2) return QUESTIONS.slice(STEP_RANGES[1].from, STEP_RANGES[1].to + 1);
    return [];
  };

  const canNext = (): boolean => {
    if (step === 1 || step === 2) {
      return stepQuestions(step).every((q) => answers[q.key]?.choice !== undefined);
    }
    if (step === 3) {
      return q11.trim().length > 0 || q12.trim().length > 0 || q13.trim().length > 0;
    }
    return false;
  };

  const goNext = () => {
    setError(null);
    if (!canNext()) {
      if (step === 3) {
        setError("좋았던 점·불편했던 점·바꾸고 싶은 점 중 한 가지는 적어 주세요.");
      } else {
        setError("이 단계의 모든 문항에 답해 주세요.");
      }
      return;
    }
    if (step < 3) {
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
      const payload: Record<string, unknown> = {
        q11_liked: q11,
        q12_disliked: q12,
        q13_oneChange: q13,
        contactEmail: email,
      };
      for (const k of SURVEY_CHOICE_KEYS) {
        payload[k] = answers[k];
      }
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "전송에 실패했어요.");
        setSubmitting(false);
        return;
      }
      setStep(4);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  if (step === 4) {
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
    step === 1 ? "사용성·이해" :
    step === 2 ? "조작·만족·계속 사용" : "마지막 한 마디";

  const stepHint =
    step === 1 ? "1분" :
    step === 2 ? "1분" : "1분";

  return (
    <div className="flex flex-col gap-6">
      {/* 진행률 + step 라벨 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[15px] font-bold text-[var(--color-text)]">
            {step}/3 · {stepTitle}
          </p>
          <p className="text-[13px] text-[var(--color-muted)]">{stepHint}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {(step === 1 || step === 2) && (
        <div className="flex flex-col gap-6">
          {stepQuestions(step).map((q) => (
            <QuestionBlock
              key={q.key}
              question={q}
              answer={answers[q.key]}
              etcOpen={etcOpen.has(q.key)}
              onChoice={(c) => setChoice(q.key, c)}
              onToggleEtc={() => toggleEtc(q.key)}
              onEtcChange={(v) => setEtc(q.key, v)}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <Step3
          q11={q11}
          setQ11={setQ11}
          q12={q12}
          setQ12={setQ12}
          q13={q13}
          setQ13={setQ13}
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
          {step < 3 ? "다음 →" : submitting ? "보내는 중..." : "의견 보내기"}
        </button>
      </div>
    </div>
  );
}

// ─── 객관식 1문항 블록 ────────────────────────────────────────

function QuestionBlock({
  question,
  answer,
  etcOpen,
  onChoice,
  onToggleEtc,
  onEtcChange,
}: {
  question: QuestionDef;
  answer: SurveyQuestionAnswer | undefined;
  etcOpen: boolean;
  onChoice: (c: SurveyChoice) => void;
  onToggleEtc: () => void;
  onEtcChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[16px] font-bold text-[var(--color-text)]">
        {question.label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3] as SurveyChoice[]).map((n, idx) => {
          const on = answer?.choice === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChoice(n)}
              className={`rounded-2xl px-2 py-3 text-center transition ${
                on
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <p
                className={`text-[18px] font-extrabold ${
                  on ? "" : "text-[var(--color-primary)]"
                }`}
              >
                {["①", "②", "③"][idx]}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold leading-tight">
                {question.options[idx]}
              </p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleEtc}
        disabled={!answer?.choice}
        className={`mt-2 text-[13px] font-semibold ${
          answer?.choice
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-muted)] opacity-60"
        }`}
      >
        {etcOpen ? "− 기타 의견 닫기" : "+ 기타 의견 적기 (선택)"}
      </button>
      {etcOpen && answer?.choice && (
        <input
          type="text"
          value={answer.etc ?? ""}
          onChange={(e) => onEtcChange(e.target.value)}
          placeholder="짧게 적어 주세요"
          maxLength={300}
          className="mt-1 w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-2 text-[15px]"
        />
      )}
    </div>
  );
}

// ─── Step 3: 서술 3문항 ───────────────────────────────────────

function Step3({
  q11,
  setQ11,
  q12,
  setQ12,
  q13,
  setQ13,
  email,
  setEmail,
}: {
  q11: string;
  setQ11: (v: string) => void;
  q12: string;
  setQ12: (v: string) => void;
  q13: string;
  setQ13: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">
        세 문항 중 한 가지만 적어 주셔도 괜찮아요.
      </p>

      <div>
        <label
          htmlFor="q11"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          11. 가장 좋았던 점은 무엇인가요?
        </label>
        <textarea
          id="q11"
          value={q11}
          onChange={(e) => setQ11(e.target.value)}
          placeholder="자유롭게 적어 주세요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={3}
          maxLength={500}
        />
      </div>

      <div>
        <label
          htmlFor="q12"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          12. 가장 불편했던 점은 무엇인가요?
        </label>
        <textarea
          id="q12"
          value={q12}
          onChange={(e) => setQ12(e.target.value)}
          placeholder="자유롭게 적어 주세요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={3}
          maxLength={500}
        />
      </div>

      <div>
        <label
          htmlFor="q13"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          13. 하나만 바꿀 수 있다면 무엇을 바꾸고 싶으신가요?
        </label>
        <textarea
          id="q13"
          value={q13}
          onChange={(e) => setQ13(e.target.value)}
          placeholder="자유롭게 적어 주세요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={3}
          maxLength={500}
        />
      </div>

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
