// 신규 사용자 온보딩 — 시니어 일자리 매칭 보고서 §5.1
import OnboardingFlow from "./onboarding-flow";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-5 py-6">
      <div className="mb-6">
        <p className="text-[16px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[26px] font-extrabold text-[var(--color-text)]">
          시작하기 전에 몇 가지 알려주세요
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)]">
          1분이면 끝나요. 입력 내용은 안전하게 보관됩니다.
        </p>
      </div>
      <OnboardingFlow />
    </main>
  );
}
