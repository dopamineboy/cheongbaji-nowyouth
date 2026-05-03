// 커뮤니티 글쓰기 페이지
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "../../lib/current-user";
import PoomasiForm from "./poomasi-form";

export const dynamic = "force-dynamic";

export default async function NewPoomasiPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-12">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/community"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 커뮤니티로
        </Link>
        <h1 className="text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          이웃에게 도움 요청하기
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          {user?.dongName} 이웃들에게 알림으로 전달돼요.
        </p>
      </header>

      <section className="mx-5">
        <Suspense fallback={<p className="text-[var(--color-muted)]">불러오는 중...</p>}>
          <PoomasiForm />
        </Suspense>
      </section>
    </main>
  );
}
