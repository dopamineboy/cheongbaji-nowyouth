"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RewardItem } from "../lib/rewards";

export default function RedeemCard({
  item,
  enabled,
}: {
  item: RewardItem;
  enabled: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const redeem = async () => {
    if (!enabled || state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setState("error");
        setMessage(data.error?.message ?? "교환에 실패했어요.");
        return;
      }
      setState("done");
      setMessage(`${item.fulfillmentS1}으로 안내드릴게요.`);
      router.refresh();
    } catch {
      setState("error");
      setMessage("네트워크 오류예요.");
    }
  };

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl" aria-hidden>{item.icon}</span>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[var(--color-muted)]">
            {item.brand}
          </p>
          <h3 className="text-[16px] font-bold text-[var(--color-text)]">
            {item.name}
          </h3>
        </div>
        <span className="text-[18px] font-extrabold text-[var(--color-primary)]">
          {item.costP.toLocaleString()}P
        </span>
      </div>
      <p className="mb-3 text-[13px] text-[var(--color-muted)]">{item.description}</p>
      {state === "done" || state === "error" ? (
        <p
          className={`rounded-xl px-3 py-2 text-center text-[14px] font-semibold ${
            state === "done"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-urgent)]/10 text-[var(--color-urgent)]"
          }`}
        >
          {message}
        </p>
      ) : (
        <button
          type="button"
          disabled={!enabled || state === "loading"}
          onClick={redeem}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[15px] font-semibold text-white disabled:bg-[var(--color-muted)]/30 disabled:text-[var(--color-muted)]"
        >
          {state === "loading"
            ? "교환 중..."
            : enabled
            ? "교환하기"
            : "포인트 부족"}
        </button>
      )}
    </article>
  );
}
