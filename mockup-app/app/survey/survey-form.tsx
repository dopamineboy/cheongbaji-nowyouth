"use client";

import { useState } from "react";
import type { SurveySection } from "../lib/types";

const SECTIONS: { value: SurveySection; ko: string; icon: string; desc: string }[] = [
  { value: "welfare", ko: "복지 알리미", icon: "📋", desc: "맞춤 복지 추천" },
  { value: "jobs", ko: "일자리 매칭", icon: "💼", desc: "내게 맞는 일자리" },
  { value: "activity", ko: "활동·미션", icon: "🎯", desc: "포인트 적립, 학습 퀴즈" },
  { value: "community", ko: "커뮤니티", icon: "💬", desc: "이웃 도움 요청" },
  { value: "none", ko: "아직 잘 모르겠어요", icon: "🤔", desc: "사용 시간이 짧아서" },
];

const SAT_OPTIONS = [
  { score: 1, label: "별로예요", emoji: "😞" },
  { score: 2, label: "그저 그래요", emoji: "😐" },
  { score: 3, label: "보통이에요", emoji: "🙂" },
  { score: 4, label: "좋아요", emoji: "😊" },
  { score: 5, label: "아주 좋아요", emoji: "🤩" },
];

export default function SurveyForm() {
  const [sat, setSat] = useState<number | null>(null);
  const [section, setSection] = useState<SurveySection | null>(null);
  const [weakest, setWeakest] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sat === null) {
      setError("전체 만족도를 골라 주세요.");
      return;
    }
    if (section === null) {
      setError("가장 도움이 된 화면을 골라 주세요.");
      return;
    }
    if (weakest.trim().length === 0 && feedback.trim().length === 0) {
      setError("개선 의견을 한 줄이라도 적어 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallSatisfaction: sat,
          mostUsefulSection: section,
          weakestPoint: weakest,
          wouldRecommend: recommend,
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
      setDone(true);
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center">
        <p className="text-4xl" aria-hidden>
          🙏
        </p>
        <h2 className="mt-3 text-[20px] font-extrabold text-[var(--color-text)]">
          소중한 의견 감사합니다
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          답해 주신 내용은 청바지 팀이 직접 읽고 다음 업데이트에 반영합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Q1. 전체 만족도 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          1. 청바지 사용해 보시니 전체적으로 어떠셨나요?
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

      {/* Q2. 가장 도움된 화면 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          2. 어느 화면이 가장 도움이 됐나요?
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                section === s.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <div className="text-2xl" aria-hidden>
                {s.icon}
              </div>
              <div>
                <p className="text-[16px] font-bold">{s.ko}</p>
                <p
                  className={`text-[12px] ${
                    section === s.value
                      ? "text-white/80"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {s.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Q3. 약점 */}
      <div>
        <label
          htmlFor="weakest"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          3. 어떤 점이 가장 아쉬웠거나 불편했나요?
        </label>
        <textarea
          id="weakest"
          value={weakest}
          onChange={(e) => setWeakest(e.target.value)}
          placeholder="예: 글자가 작아서 읽기 어려웠어요 / 일자리 검색이 느렸어요"
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={3}
          maxLength={300}
        />
      </div>

      {/* Q4. 추천 의향 */}
      <div>
        <label className="mb-2 block text-[16px] font-bold text-[var(--color-text)]">
          4. 친구나 이웃 어르신께 청바지를 추천하시겠어요?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: true, label: "추천해요", icon: "👍" },
            { v: null, label: "잘 모르겠어요", icon: "🤷" },
            { v: false, label: "추천 어려워요", icon: "👎" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setRecommend(o.v as boolean | null)}
              className={`rounded-2xl p-3 text-center transition ${
                recommend === o.v
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

      {/* Q5. 자유 의견 */}
      <div>
        <label
          htmlFor="feedback"
          className="mb-2 block text-[16px] font-bold text-[var(--color-text)]"
        >
          5. 청바지 팀에 꼭 전하고 싶은 한마디를 적어 주세요
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
          연락받을 이메일 (선택)
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

      {error && (
        <p className="rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-[18px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "보내는 중..." : "의견 보내기"}
      </button>
    </form>
  );
}
