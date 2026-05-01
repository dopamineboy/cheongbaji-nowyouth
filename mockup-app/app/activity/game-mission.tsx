"use client";

// 인지 훈련 게임 — 숫자 기억 미니게임 (4대통합서비스_구현계획서 §3.2)
// 단순화: 3자리 숫자 1.5초 노출 → 가리고 입력 → 정답이면 GAME +20P 적립 API 호출

import { useState } from "react";

type Phase = "idle" | "show" | "input" | "result";

function randNumber(): string {
  return Math.floor(Math.random() * 900 + 100).toString();
}

export default function GameMission() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [pending, setPending] = useState(false);
  const [earned, setEarned] = useState(false);

  const start = () => {
    const n = randNumber();
    setTarget(n);
    setInput("");
    setResult(null);
    setPhase("show");
    setTimeout(() => setPhase("input"), 1500);
  };

  const submit = async () => {
    const win = input.trim() === target;
    setResult(win ? "win" : "lose");
    setPhase("result");
    if (!win || earned) return;
    setPending(true);
    try {
      const res = await fetch("/api/points/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "GAME", metadata: { game: "숫자기억", target } }),
      });
      const data = await res.json();
      if (data.ok) setEarned(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="card-soft rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl" aria-hidden>🧩</span>
        <h3 className="text-[18px] font-bold text-[var(--color-text)]">
          숫자 기억 게임
        </h3>
        <span className="ml-auto rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
          +20P
        </span>
      </div>

      {phase === "idle" && (
        <>
          <p className="mb-4 text-[15px] text-[var(--color-muted)]">
            화면에 잠깐 보이는 3자리 숫자를 외워보세요.
          </p>
          <button
            type="button"
            onClick={start}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[17px] font-semibold text-white"
          >
            시작하기
          </button>
        </>
      )}

      {phase === "show" && (
        <div className="flex h-32 items-center justify-center rounded-xl bg-[var(--bg-page)]">
          <span className="text-[60px] font-extrabold text-[var(--color-primary)]">{target}</span>
        </div>
      )}

      {phase === "input" && (
        <>
          <p className="mb-3 text-[15px] text-[var(--color-muted)]">
            방금 본 숫자를 입력해주세요.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className="mb-3 w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-center text-[28px] font-bold tracking-widest"
          />
          <button
            type="button"
            onClick={submit}
            disabled={input.length !== 3}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[17px] font-semibold text-white disabled:opacity-40"
          >
            확인
          </button>
        </>
      )}

      {phase === "result" && (
        <>
          {result === "win" ? (
            <div className="rounded-xl bg-[var(--color-success)]/10 p-4 text-center">
              <p className="text-[20px] font-bold text-[var(--color-success)]">정답이에요! 🎉</p>
              <p className="mt-1 text-[14px] text-[var(--color-muted)]">
                {earned ? "20포인트 적립됐어요." : pending ? "포인트 적립 중..." : "오늘은 이미 적립했어요."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-urgent)]/10 p-4 text-center">
              <p className="text-[20px] font-bold text-[var(--color-urgent)]">
                정답은 {target}이었어요
              </p>
              <p className="mt-1 text-[14px] text-[var(--color-muted)]">한 번 더 도전해보세요!</p>
            </div>
          )}
          <button
            type="button"
            onClick={start}
            className="mt-3 w-full rounded-xl border-2 border-[var(--color-primary)] bg-white py-3 text-[17px] font-semibold text-[var(--color-primary)]"
          >
            다시 하기
          </button>
        </>
      )}
    </article>
  );
}
