"use client";

// 한글 단어 맞추기 — 자음/모음 섞인 4글자 단어를 올바른 순서로 배열
import { useMemo, useState } from "react";

const WORDS = [
  "가족사랑",
  "건강생활",
  "친구방문",
  "전통시장",
  "도서관에서",
  "공원산책",
  "요리수업",
  "카드만들기",
  "노래교실",
  "한글공부",
];

function shuffle<T>(arr: T[], seed: number): T[] {
  const rng = (() => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  })();
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HangulMission() {
  const [round, setRound] = useState(0);
  const word = useMemo(() => WORDS[round % WORDS.length], [round]);
  const chars = useMemo(() => Array.from(word), [word]);
  const shuffled = useMemo(() => shuffle(chars, round + 7), [chars, round]);
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [earned, setEarned] = useState(false);

  const remainingIdx = shuffled.map((_, i) => i).filter((i) => !picked.includes(i));
  const assembled = picked.map((i) => shuffled[i]).join("");

  const reset = () => {
    setPicked([]);
    setResult(null);
  };

  const next = () => {
    setRound((r) => r + 1);
    reset();
  };

  const handlePick = (i: number) => {
    if (result) return;
    const newPicked = [...picked, i];
    setPicked(newPicked);
    if (newPicked.length === chars.length) {
      const assembled = newPicked.map((j) => shuffled[j]).join("");
      const win = assembled === word;
      setResult(win ? "win" : "lose");
      if (win && !earned) {
        fetch("/api/points/earn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "GAME", metadata: { game: "한글맞추기", word } }),
        }).then(() => setEarned(true));
      }
    }
  };

  const undo = () => {
    if (result) return;
    setPicked((p) => p.slice(0, -1));
  };

  return (
    <article className="card-soft rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl" aria-hidden>📚</span>
        <h3 className="text-[18px] font-bold text-[var(--color-text)]">
          한글 단어 맞추기
        </h3>
        <span className="ml-auto rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
          +20P
        </span>
      </div>

      <p className="mb-4 text-[14px] text-[var(--color-muted)]">
        섞여 있는 글자를 순서대로 눌러 단어를 만들어보세요.
      </p>

      <div className="mb-3 rounded-xl bg-[var(--bg-page)] p-4 text-center">
        <p className="text-[12px] text-[var(--color-muted)]">맞춰야 할 단어</p>
        <p className="mt-1 text-[28px] font-extrabold tracking-widest text-[var(--color-primary)]">
          {assembled || "____"}
        </p>
        {result === "lose" && (
          <p className="mt-1 text-[13px] text-[var(--color-urgent)]">
            정답은 <strong>{word}</strong>이었어요
          </p>
        )}
        {result === "win" && (
          <p className="mt-1 text-[13px] font-bold text-[var(--color-success)]">
            정답입니다! {earned && "(+20P)"}
          </p>
        )}
      </div>

      <div className="mb-3 grid grid-cols-5 gap-2">
        {shuffled.map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={picked.includes(i) || result !== null}
            onClick={() => handlePick(i)}
            className="aspect-square rounded-xl border-2 border-[var(--color-border)] bg-white text-[22px] font-bold text-[var(--color-text)] disabled:opacity-30"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {result === null ? (
          <button
            type="button"
            onClick={undo}
            disabled={picked.length === 0}
            className="flex-1 rounded-xl border-2 border-[var(--color-border)] bg-white py-3 text-[15px] font-semibold text-[var(--color-text)] disabled:opacity-40"
          >
            한 칸 지우기
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-[15px] font-semibold text-white"
          >
            다음 문제
          </button>
        )}
      </div>
    </article>
  );
}
