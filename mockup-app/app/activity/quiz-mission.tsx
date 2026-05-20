"use client";

// 복지 학습 퀴즈 — "오늘의 혜택" 내용을 OX/3지선다로 학습.
// 정답 시 +10P (LEARN). 매일 다른 문제 노출 (단순 인덱스 기반).
import { useEffect, useMemo, useState } from "react";
import { LEDGER_ICON } from "../components/ledger-icons";

interface Question {
  q: string;
  options: string[];
  answer: number; // index
  explain: string;
}

const QUESTIONS: Question[] = [
  {
    q: "기초연금은 몇 세부터 받을 수 있을까요?",
    options: ["만 60세", "만 65세", "만 70세"],
    answer: 1,
    explain: "기초연금은 만 65세 이상부터 신청할 수 있어요.",
  },
  {
    q: "에너지바우처는 언제 신청하면 좋을까요?",
    options: ["여름 시작 전", "겨울 시작 전", "봄·가을 모두"],
    answer: 1,
    explain: "겨울철 난방비 부담을 덜기 위해 11월 이전에 신청하시는 게 좋아요.",
  },
  {
    q: "문화누리카드 1년 지원 금액은 약 얼마일까요?",
    options: ["7만원", "14만원", "30만원"],
    answer: 1,
    explain: "기초생활수급자·차상위 대상 연 14만원의 문화·여행·체육 바우처예요.",
  },
  {
    q: "65세 이상 어르신의 지하철 이용은?",
    options: ["50% 할인", "무료", "전액 본인부담"],
    answer: 1,
    explain: "수도권 지하철·일부 광역철도를 무료로 이용하실 수 있어요.",
  },
  {
    q: "노인일자리 사업 신청 시 가장 먼저 하시는 일은?",
    options: [
      "주민센터에 직접 방문",
      "온라인 신청부터 가능",
      "동주민센터·시니어클럽 모두 가능",
    ],
    answer: 2,
    explain: "동주민센터, 시니어클럽, 노인복지관 등에서 신청하실 수 있어요.",
  },
  {
    q: "치매 조기검진은 어디서 받을 수 있을까요?",
    options: ["동네 약국", "보건소 치매안심센터", "백화점 의료실"],
    answer: 1,
    explain: "관할 보건소의 치매안심센터에서 무료로 받으실 수 있어요.",
  },
  {
    q: "어르신 통신요금 감면 — 매월 얼마까지?",
    options: ["월 5,000원", "월 11,000원", "월 30,000원"],
    answer: 1,
    explain: "기초연금 수급자는 월 최대 11,000원까지 감면받을 수 있어요.",
  },
];

export default function QuizMission() {
  const [idx, setIdx] = useState(0);
  const q = useMemo(() => QUESTIONS[idx % QUESTIONS.length], [idx]);
  const [picked, setPicked] = useState<number | null>(null);
  const [earned, setEarned] = useState<Set<number>>(new Set());

  useEffect(() => {
    // 페이지 진입 시 오늘의 인덱스로 자동 (날짜 기반)
    const today = new Date().getDate();
    setIdx(today % QUESTIONS.length);
  }, []);

  const submit = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer && !earned.has(idx)) {
      fetch("/api/points/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEARN", metadata: { quizIdx: idx } }),
      }).then(() => setEarned((e) => new Set([...e, idx])));
    }
  };

  const next = () => {
    setIdx((i) => (i + 1) % QUESTIONS.length);
    setPicked(null);
  };

  const isCorrect = picked !== null && picked === q.answer;
  const isWrong = picked !== null && picked !== q.answer;

  const LearnIcon = LEDGER_ICON.LEARN;

  return (
    <article className="card-soft rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          aria-hidden="true"
        >
          <LearnIcon size={20} />
        </span>
        <h3 className="text-[18px] font-bold text-[var(--color-text)]">
          복지 학습 퀴즈
        </h3>
        <span className="ml-auto rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
          +10P
        </span>
      </div>

      <p className="mb-4 text-[16px] font-semibold leading-relaxed text-[var(--color-text)]">
        Q. {q.q}
      </p>

      <div className="mb-3 flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = q.answer === i && picked !== null;
          let cls =
            "rounded-xl border-2 border-[var(--color-border)] bg-white text-[var(--color-text)]";
          if (isAnswer)
            cls = "rounded-xl border-2 border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]";
          else if (isPicked && !isAnswer)
            cls = "rounded-xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent)]/10 text-[var(--color-urgent)]";

          return (
            <button
              key={i}
              type="button"
              disabled={picked !== null}
              onClick={() => submit(i)}
              className={`${cls} px-4 py-3 text-left text-[15px] font-semibold disabled:cursor-default`}
            >
              {String.fromCharCode(0x2460 + i)} {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div
          className={`mb-3 rounded-xl p-3 text-[14px] ${
            isCorrect
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-accent)]/15 text-[#8A5E00]"
          }`}
        >
          <p className="font-bold">
            {isCorrect ? "정답이에요!" : "아쉬워요!"}{" "}
            {isCorrect && earned.has(idx) && "(+10P 적립)"}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed">{q.explain}</p>
        </div>
      )}

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[16px] font-semibold text-white"
        >
          다음 문제
        </button>
      )}
    </article>
  );
}
