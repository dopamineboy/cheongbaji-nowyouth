// /survey — MVP 개선 의견 수집 설문 (공모전 데모용)
import Link from "next/link";
import { Suspense } from "react";
import SurveyForm from "./survey-form";

export const dynamic = "force-dynamic";

export default function SurveyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-28">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 홈으로
        </Link>
        <h1 className="text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          청바지가 더 좋아지도록
          <br />
          의견을 들려주세요
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          앱 사용 설문 — 시간 2~3분, 13문항 3단계예요. 답해 주신 내용은 청바지
          팀과 공모전 심사위원에게만 전달되고, 다음 업데이트에 반영합니다.
        </p>
      </header>

      <section className="mx-5">
        <Suspense fallback={<p className="text-[var(--color-muted)]">불러오는 중...</p>}>
          <SurveyForm />
        </Suspense>
      </section>

      <TabBar />
    </main>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity" },
    { label: "커뮤니티", icon: "💬", href: "/community" },
    { label: "설문", icon: "📝", href: "/survey", active: true },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 z-30 border-t border-[var(--color-border)] bg-white">
      <ul className="grid grid-cols-6">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-[12px] font-medium ${
                t.active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
