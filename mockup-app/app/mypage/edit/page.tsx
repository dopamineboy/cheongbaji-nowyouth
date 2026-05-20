// 마이페이지 — 인터뷰 정보 부분 수정
// 모든 필드를 한 페이지에 보여주고, 변경된 필드만 API로 보냄.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/current-user";
import { isOnboarded } from "../../lib/auth";
import EditForm from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  if (!(await isOnboarded())) redirect("/welcome");
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col gap-4 bg-[var(--bg-page)] px-5 pt-6 pb-12">
      <header>
        <Link
          href="/mypage"
          className="text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 마이페이지
        </Link>
        <h1 className="mt-2 text-[24px] font-extrabold text-[var(--color-text)]">
          정보 수정
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          바꾸고 싶은 항목만 새로 골라주세요. 변경된 항목만 저장돼요.
        </p>
      </header>
      <EditForm initial={user} />
    </main>
  );
}
