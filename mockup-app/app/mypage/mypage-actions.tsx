"use client";

// 마이페이지 액션 버튼들 — 인터뷰 다시 하기
// 인터뷰 데이터 부분 수정은 추후 단일 필드 편집 화면으로 확장 예정.
import { useState } from "react";

export default function MypageActions() {
  const [busy, setBusy] = useState(false);

  const editInterview = async () => {
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
        onClick={editInterview}
        disabled={busy}
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-[17px] font-bold text-white disabled:opacity-50"
      >
        ✏️ 인터뷰 다시 하기
      </button>
      <p className="px-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        나이·거주지·가구·소득·일자리 선호를 한 번에 다시 입력하실 수 있어요.
        곧 항목별로 따로 수정하는 기능도 추가할 예정이에요.
      </p>
    </div>
  );
}
