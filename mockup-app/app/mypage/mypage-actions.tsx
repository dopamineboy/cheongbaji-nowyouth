"use client";

// 마이페이지 액션 버튼들
//   ① 저장하고 홈화면으로 돌아가기 — 큰 primary CTA (수정 끝낸 후 새 추천 보기)
//   ② 인터뷰 처음부터 다시 — 보조 (전체 재입력)
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MypageActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const goHomeWithFreshRecs = () => {
    // 각 항목 저장 시점에 이미 cookie 영속화 + revalidatePath가 호출됐으므로
    // 홈은 새로 SSR된다. router.refresh로 client cache도 명시 무효화.
    router.refresh();
    router.push("/?updated=mypage");
  };

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
      {/* 큰 primary CTA — 수정 마치고 홈에서 새 추천 받기 */}
      <button
        type="button"
        onClick={goHomeWithFreshRecs}
        className="btn-primary rounded-2xl py-4 text-[17px] font-bold"
      >
        ✓ 저장하고 홈화면으로 가기
      </button>
      <p className="px-1 -mt-1 mb-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
        바뀐 정보로 맞춤 추천을 새로 계산해서 보여드려요.
      </p>

      {/* 보조 — 전체 인터뷰 다시 */}
      <button
        type="button"
        onClick={restartInterview}
        disabled={busy}
        className="rounded-2xl border-2 border-[var(--color-border)] bg-white py-3 text-[15px] font-bold text-[var(--color-text)] disabled:opacity-50"
      >
        🔄 인터뷰 처음부터 다시
      </button>
      <p className="px-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        위 각 항목을 누르면 그 항목만 수정하실 수 있어요. 처음부터 새로
        입력하고 싶으시면 위 버튼을 눌러 주세요.
      </p>
    </div>
  );
}
