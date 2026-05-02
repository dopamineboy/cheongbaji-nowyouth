"use client";

// 어디서든 클릭하면 인터뷰 처음부터 다시 시작
export default function RestartButton({
  variant = "icon",
}: {
  variant?: "icon" | "text" | "full";
}) {
  const restart = async () => {
    if (
      !confirm(
        "처음 화면부터 다시 시작할까요? 입력하신 정보는 초기화돼요.",
      )
    )
      return;
    await fetch("/api/onboarding/complete", { method: "DELETE" });
    window.location.href = "/welcome";
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={restart}
        className="rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[16px] font-semibold text-[var(--color-text)]"
      >
        🔄 처음부터 다시 시작
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={restart}
        className="text-[13px] font-semibold text-[var(--color-muted)] underline"
      >
        처음부터 다시
      </button>
    );
  }

  // icon (default) — 우상단 작은 라운드 버튼
  return (
    <button
      type="button"
      onClick={restart}
      title="처음부터 다시 시작"
      aria-label="처음부터 다시 시작"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[18px] shadow-sm border border-[var(--color-border)] hover:bg-[var(--bg-page)]"
    >
      🔄
    </button>
  );
}
