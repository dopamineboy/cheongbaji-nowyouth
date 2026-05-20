"use client";

// 마이페이지 액션 버튼들 — 부분 수정 + 전체 다시 입력
import Link from "next/link";
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
      <Link
        href="/mypage/edit"
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-center text-[17px] font-bold text-white"
      >
        ✏️ 정보 수정하기
      </Link>
      <button
        type="button"
        onClick={restartInterview}
        disabled={busy}
        className="rounded-2xl border-2 border-[var(--color-border)] bg-white py-3 text-[15px] font-bold text-[var(--color-text)] disabled:opacity-50"
      >
        🔄 인터뷰 처음부터 다시
      </button>
      <p className="px-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        "정보 수정하기"에서는 출생·거주지·가구·소득·자격 정보를 한 화면에서
        원하는 항목만 골라 바꾸실 수 있어요.
      </p>
    </div>
  );
}
