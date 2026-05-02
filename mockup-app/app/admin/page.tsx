// 어드민 페이지 — 토큰 게이트 + 세션·프로필·어댑터 확인 도구
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfileOverride, isOnboarded } from "../lib/auth";
import { getCurrentUser } from "../lib/current-user";
import { adapterStatus } from "../lib/jobs/ingestion/pipeline";
import AdminActions from "./admin-actions";

export const dynamic = "force-dynamic";

const PUBLIC_ADMIN_PIN = process.env.ADMIN_PIN ?? "1234"; // 데모용 — 운영 시 강력한 값 권장

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>;
}) {
  const sp = await searchParams;
  if (sp.pin !== PUBLIC_ADMIN_PIN) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-5 pt-12">
        <h1 className="mb-3 text-[24px] font-extrabold text-[var(--color-text)]">
          🔐 어드민
        </h1>
        <p className="mb-6 text-[14px] text-[var(--color-muted)]">
          PIN을 입력하세요.
        </p>
        <form method="get" className="flex flex-col gap-3">
          <input
            name="pin"
            type="password"
            placeholder="PIN"
            className="rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary rounded-xl py-3 text-[16px] font-bold"
          >
            로그인
          </button>
        </form>
        <p className="mt-6 text-[12px] text-[var(--color-muted)]">
          데모 PIN: 1234 (운영 시 ADMIN_PIN 환경변수로 변경)
        </p>
      </main>
    );
  }

  const onboarded = await isOnboarded();
  const override = await getProfileOverride();
  const user = await getCurrentUser();
  const adapters = adapterStatus();

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-5 pb-12 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-[24px] font-extrabold text-[var(--color-text)]">
          🛠 어드민
        </h1>
        <Link href="/" className="text-[14px] font-bold text-[var(--color-primary)]">
          홈으로
        </Link>
      </header>

      {/* 현재 세션 */}
      <section className="card-soft mb-5 rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
          현재 세션
        </h2>
        <ul className="space-y-2 text-[14px]">
          <li>
            <span className="font-bold">온보딩: </span>
            {onboarded ? "✅ 완료" : "❌ 미완료"}
          </li>
          <li>
            <span className="font-bold">프로필 쿠키: </span>
            {override ? "✅ 영속화됨" : "❌ 없음 (sample 사용 중)"}
          </li>
          <li>
            <span className="font-bold">표시 이름: </span>
            {user?.name}
          </li>
          <li>
            <span className="font-bold">거주지: </span>
            {user?.region} {user?.district}
          </li>
          <li>
            <span className="font-bold">좌표: </span>
            ({user?.lat?.toFixed(4)}, {user?.lng?.toFixed(4)})
          </li>
        </ul>
      </section>

      {/* 일자리 어댑터 */}
      <section className="card-soft mb-5 rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
          일자리 수집 어댑터
        </h2>
        <ul className="space-y-2 text-[14px]">
          {adapters.map((a) => (
            <li key={a.source}>
              <span className="font-bold">{a.source}: </span>
              {a.available ? "✅ 활성" : "❌ 키 없음"} · 갱신 {a.refreshIntervalMin}분 · 최근 동기화{" "}
              {a.lastSyncAt
                ? new Date(a.lastSyncAt).toLocaleString("ko-KR")
                : "없음"}
            </li>
          ))}
        </ul>
      </section>

      <AdminActions />

      {/* 외부 API 키 상태 (값은 노출 X) */}
      <section className="card-soft mt-5 rounded-2xl bg-white p-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
          외부 API 키 (서버 환경)
        </h2>
        <ul className="space-y-2 text-[14px]">
          <li>
            <span className="font-bold">KORDI: </span>
            {process.env.KORDI_API_KEY ? "✅" : "❌"}
          </li>
          <li>
            <span className="font-bold">KAKAO: </span>
            {process.env.KAKAO_REST_API_KEY ? "✅" : "❌"}
          </li>
          <li>
            <span className="font-bold">OPENAI: </span>
            {process.env.OPENAI_API_KEY ? "✅" : "❌"}
          </li>
          <li>
            <span className="font-bold">WORKNET: </span>
            {process.env.WORKNET_API_KEY ? "✅" : "❌ (사업자 등록 후)"}
          </li>
        </ul>
      </section>
    </main>
  );
}
