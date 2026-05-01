"use client";
import { useState } from "react";

export default function ApplyButton({
  jobId,
  applyUrl,
}: {
  jobId: string;
  applyUrl: string;
}) {
  const [state, setState] = useState<"idle" | "earning" | "earned">("idle");

  const handle = async () => {
    if (state !== "idle") return;
    setState("earning");
    try {
      await fetch("/api/points/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "JOB",
          amount: 50,
          metadata: { jobId, action: "interest" },
        }),
      });
      setState("earned");
    } catch {
      setState("idle");
    }
  };

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handle}
      className="block rounded-2xl bg-[var(--color-primary)] py-4 text-center text-[18px] font-bold text-white"
    >
      {state === "earned"
        ? "지원 사이트 열기 → (+50P 적립됨)"
        : state === "earning"
        ? "포인트 적립 중..."
        : "관심 있어요 (+50P)"}
    </a>
  );
}
