// ④ 커뮤니티 커뮤니티 — 우리 동 게시판
import Link from "next/link";
import type { PoomasiCategory, PoomasiPost } from "../lib/types";
import { getStore } from "../lib/store";
import { getCurrentUser } from "../lib/current-user";
import GuideVideoButton from "../components/guide-video-button";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<PoomasiCategory, { ko: string; icon: string }> = {
  life_help: { ko: "생활 도움", icon: "🏥" },
  house_chore: { ko: "가사 커뮤니티", icon: "🍲" },
  digital: { ko: "디지털 도움", icon: "📱" },
  talk: { ko: "대화 상대", icon: "🚶" },
  skill_share: { ko: "재능 나눔", icon: "🎨" },
  etc: { ko: "기타", icon: "✨" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

function PoomasiCard({ p }: { p: PoomasiPost }) {
  const cat = CAT_LABEL[p.category];
  return (
    <article className="card-soft rounded-2xl bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[13px] font-semibold text-[#8A5E00]">
          {cat.icon} {cat.ko}
        </span>
        {p.isSeed && (
          <span className="rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--color-muted)]">
            예시
          </span>
        )}
        <span className="text-[13px] text-[var(--color-muted)]">
          {p.authorMaskedName} · {timeAgo(p.createdAt)}
        </span>
      </div>
      {p.isSeed && (
        <p className="mb-2 text-[11px] text-[var(--color-muted)]">
          📍 {p.dongName}
        </p>
      )}

      <h3 className="mb-2 text-[18px] font-bold leading-tight text-[var(--color-text)]">
        {p.title}
      </h3>
      <p className="mb-3 text-[15px] leading-relaxed text-[var(--color-muted)]">{p.body}</p>

      {p.preferredTime && (
        <div className="mb-3 rounded-lg bg-[var(--bg-page)] px-3 py-2 text-[14px]">
          <span className="font-semibold text-[var(--color-text)]">희망 시간 </span>
          <span className="text-[var(--color-muted)]">{p.preferredTime}</span>
        </div>
      )}

      <button
        type="button"
        className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[17px] font-semibold text-white"
      >
        지원하기 (+100P)
      </button>
    </article>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity" },
    { label: "커뮤니티", icon: "💬", href: "/community", active: true },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 border-t border-[var(--color-border)] bg-white">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-[13px] font-medium ${
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

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const all = getStore().poomasi;
  const myDong = user?.dongCode ?? "";
  const myDongName = user?.dongName ?? "우리 동";

  // 본인이 작성한 실제 글 (시드 제외)
  const ownPosts = all.filter(
    (p) =>
      !p.isSeed &&
      p.status === "open" &&
      p.dongCode === myDong &&
      p.reportCount < 3,
  );

  // MVP — 시드 글은 콘텐츠는 그대로 두되 표시 지역만 사용자 본인 동으로 swap
  // (실제 운영 전엔 모든 사용자에게 같은 시드를 본인 동네 글처럼 보여주기 위함)
  const seedPosts = all
    .filter((p) => p.isSeed && p.status === "open" && p.reportCount < 3)
    .map((p) => ({ ...p, dongCode: myDong, dongName: myDongName }));

  const open = [...ownPosts, ...seedPosts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const showingSeeds = ownPosts.length === 0 && seedPosts.length > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-muted)]">
              {user?.dongName} 이웃과
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold text-[var(--color-text)]">
              서로 <span className="text-[var(--color-primary)]">커뮤니티</span>
            </h1>
          </div>
          <GuideVideoButton src="community" label="커뮤니티" />
        </div>
      </header>

      <section className="hero-emerald mx-5 mb-5 rounded-2xl p-5">
        <p className="text-[15px] font-medium text-white/80">
          우리 동 요청글
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[40px] font-extrabold leading-tight">
            {open.length}
          </span>
          <span className="text-[18px] font-medium">건</span>
        </div>
        <p className="mt-2 text-[14px] text-white/70">
          도움 1회당 양쪽 100P 적립 · 금전 거래 X
        </p>
      </section>

      {showingSeeds && (
        <div className="mx-5 mb-4 rounded-xl bg-[var(--bg-soft-yellow)] border border-[var(--color-accent)]/40 p-3">
          <p className="text-[13px] leading-relaxed text-[var(--color-text)]">
            <span className="font-bold">📌 MVP 시연 안내</span>
            <br />
            아래 글은 시연용 예시예요. 직접 글을 남기시면 같은 동네 이웃과 실제로 연결됩니다.
          </p>
        </div>
      )}

      <div className="mx-5 mb-4 flex gap-2">
        <Link
          href="/community/new"
          className="flex-1 rounded-xl bg-[var(--color-accent)] py-3 text-center text-[17px] font-semibold text-white"
        >
          ✏ 요청글 작성
        </Link>
      </div>

      <section className="flex flex-col gap-3 px-5">
        {open.map((p) => (
          <PoomasiCard key={p.id} p={p} />
        ))}
        {open.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-center text-[15px] text-[var(--color-muted)]">
            아직 우리 동 요청글이 없어요. 첫 글을 남겨보세요.
          </p>
        )}
      </section>

      <section className="mx-5 mt-6 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
        <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">안전 안내</span>
          <br />
          금융·투자·종교 권유는 금지돼 있어요. 부적절한 글은 신고해주세요. 3회 누적 시 자동 정지.
        </p>
      </section>

      <TabBar />
    </main>
  );
}
