"use client";

// 스탬프 보드 — 각 spot별 방문 인증 + 포인트 적립 (클라이언트 인터랙션)
import { useState } from "react";
import type { Spot } from "../../../lib/outings/data";

interface StampBoardProps {
  outingId: string;
  spots: Spot[];
  totalBonus: number;
}

export default function StampBoard({ outingId, spots, totalBonus }: StampBoardProps) {
  const [stamped, setStamped] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const stampedCount = Object.values(stamped).filter(Boolean).length;
  const allDone = stampedCount === spots.length && spots.length > 0;
  const completionBonus = Math.max(
    0,
    totalBonus - spots.reduce((s, sp) => s + sp.rewardPoints, 0),
  );

  const stamp = async (spot: Spot) => {
    if (stamped[spot.id] || busy) return;
    setBusy(spot.id);
    try {
      const res = await fetch("/api/points/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STAMP",
          amount: spot.rewardPoints,
          metadata: { outingId, spotId: spot.id, spotName: spot.name },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStamped((prev) => ({ ...prev, [spot.id]: true }));
        setToast(`+${spot.rewardPoints}P 적립! ${spot.name} 인증 완료`);
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast(data.error?.message ?? "잠시 후 다시 시도해주세요.");
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast("네트워크 오류 — 다시 시도해주세요.");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setBusy(null);
    }
  };

  const claimCompletion = async () => {
    if (!allDone || completionBonus <= 0 || busy) return;
    setBusy("completion");
    try {
      const res = await fetch("/api/points/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STAMP",
          amount: completionBonus,
          metadata: { outingId, type: "outing_completion_bonus" },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast(`🎉 코스 완주! 보너스 +${completionBonus}P 적립`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <section className="mx-5 mb-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[18px] font-bold text-[var(--color-text)]">
            📍 방문 순서 · 스탬프
          </h2>
          <span className="text-[13px] font-bold text-[var(--color-warm-strong)]">
            {stampedCount} / {spots.length} 완료
          </span>
        </div>

        {/* 진행 게이지 */}
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-warm)] transition-all"
            style={{ width: `${spots.length ? (stampedCount / spots.length) * 100 : 0}%` }}
          />
        </div>

        <div className="flex flex-col gap-3">
          {spots.map((s, idx) => {
            const isStamped = !!stamped[s.id];
            const isBusy = busy === s.id;
            return (
              <article
                key={s.id}
                className={`rounded-2xl border-2 p-4 transition ${
                  isStamped
                    ? "border-[var(--color-success)] bg-[var(--color-success)]/5"
                    : "border-[var(--color-border)] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold ${
                      isStamped
                        ? "bg-[var(--color-success)] text-white"
                        : "bg-[var(--color-warm)]/15 text-[var(--color-warm-strong)]"
                    }`}
                  >
                    {isStamped ? "✓" : idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[17px] font-bold text-[var(--color-text)]">
                        {s.imageEmoji} {s.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                      {s.category} · {s.freeEntryNote}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--color-text)]">
                      🚇 {s.nearestStation} · {s.line.join("·")}
                    </p>
                    {s.tip && (
                      <p
                        className="mt-2 rounded-lg bg-[var(--bg-soft-yellow)] p-2 text-[12px] leading-snug text-[var(--color-text)]"
                        style={{ wordBreak: "keep-all" }}
                      >
                        💡 {s.tip}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => stamp(s)}
                  disabled={isStamped || !!busy}
                  className={`mt-3 w-full rounded-xl py-3 text-[15px] font-bold transition ${
                    isStamped
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "bg-[var(--color-warm)] text-white disabled:opacity-50"
                  }`}
                >
                  {isStamped
                    ? `✓ 방문 인증 완료 · +${s.rewardPoints}P 적립`
                    : isBusy
                    ? "적립 중..."
                    : `🪪 방문했어요 · +${s.rewardPoints}P 받기`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 코스 완주 보너스 */}
      {allDone && completionBonus > 0 && (
        <section className="mx-5 mb-5">
          <button
            type="button"
            onClick={claimCompletion}
            disabled={busy === "completion"}
            className="btn-primary block w-full rounded-2xl py-5 text-[17px] font-bold disabled:opacity-50"
          >
            🎉 코스 완주 보너스 +{completionBonus}P 받기
          </button>
        </section>
      )}

      {allDone && completionBonus === 0 && (
        <section className="mx-5 mb-5">
          <div className="rounded-2xl bg-[var(--bg-soft-orange)] p-5 text-center">
            <p className="text-[18px] font-extrabold text-[var(--color-warm-strong)]">
              🎉 코스 완주!
            </p>
            <p className="mt-1 text-[14px] text-[var(--color-text)]">
              오늘 정말 멋진 하루 보내셨어요. 수고 많으셨습니다.
            </p>
          </div>
        </section>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 w-[90%] max-w-[400px] -translate-x-1/2 rounded-2xl bg-[var(--color-text)] px-5 py-4 text-center text-[14px] font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
