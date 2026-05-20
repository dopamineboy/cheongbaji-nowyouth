"use client";

// 마이페이지 액션 버튼들 — 전체 다시 입력 (부분 수정은 각 row 클릭)
import { useState } from "react";

export default function MypageActions() {
  const [busy, setBusy] = useState(false);

  const restartInterview = async () => {
    if (busy) return;
    const ok = confirm(
      "인터뷰를 처음부터 다시 진행하시겠어요?\n입력하신 정보가 새로 덮어쓰여요.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await fetch("/api/onboarding/complete", { method: "DELETE" });
      window.location.href = "/onboarding";
    } catch {
      setBusy(false);
      alert("문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={restartInterview}
        disabled={busy}
        className="rounded-2xl border-2 border-[var(--color-border)] bg-white py-3 text-[15px] font-bold text-[var(--color-text)] disabled:opacity-50"
      >
        🔄 인터뷰 처음부터 다시
      </button>
      <p className="px-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        위 각 항목을 누르면 그 항목만 수정하실 수 있어요. 일자리 선호처럼
        한 번에 새로 입력하시는 게 좋은 항목은 위 버튼을 사용해 주세요.
      </p>
    </div>
  );
}
