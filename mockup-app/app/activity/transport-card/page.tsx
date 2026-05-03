// 경로우대 교통카드 발급 안내 — 활동 진입 전환율을 위한 작은 가이드
// AC §활동 강화 기능 7
import Link from "next/link";

export const dynamic = "force-static";

const FAQS: { q: string; a: string; sub?: string }[] = [
  {
    q: "1. 나는 발급 대상인가요?",
    a: "만 65세 이상이시면 누구나 받으실 수 있어요.",
    sub: "내국인·외국인 등록자·영주권자 모두 가능. 신청 당시 만 65세에 도달했는지가 기준이에요.",
  },
  {
    q: "2. 어디서 발급하나요?",
    a: "주소지 행정복지센터(주민센터) 또는 농협·신한·우리·국민·하나 등 지정 은행에서 받으실 수 있어요.",
    sub: "주민센터에서 발급하면 보통 그 자리에서 30분 이내에 받으실 수 있고, 은행은 영업점에 따라 며칠 걸릴 수 있어요.",
  },
  {
    q: "3. 무엇을 가져가야 하나요?",
    a: "신분증 1개만 있으면 됩니다.",
    sub: "주민등록증, 운전면허증, 여권, 외국인등록증 모두 가능. 사진은 보통 별도로 필요 없어요(주민등록증 발급 시점 사진 사용).",
  },
  {
    q: "4. 다른 지역에서도 쓸 수 있나요?",
    a: "전국 도시철도 무임승차 가능. 단 버스는 지역마다 달라요.",
    sub: "서울·부산·대구·인천·광주·대전·대구·세종 등 전국 도시철도 모두 적용. 버스는 지역별로 무료/K-패스 환급/일반 유료가 다르니 거주 시·도 안내를 확인해주세요.",
  },
  {
    q: "5. 분실하면 어떻게 하나요?",
    a: "발급받으셨던 주민센터 또는 은행에서 재발급 가능해요.",
    sub: "분실 신고 후 재발급 수수료(보통 무료~3,000원)가 들 수 있어요. 분실한 카드의 잔액은 신고 시점 기준으로 보호됩니다.",
  },
];

const CHECKLIST = [
  "신분증 챙겼어요",
  "주소지 주민센터 또는 가까운 지정 은행 위치 확인했어요",
  "은행 가시면 영업시간(보통 오전 9시~오후 4시) 확인했어요",
];

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity", active: true },
    { label: "커뮤니티", icon: "💬", href: "/community" },
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

export default function TransportCardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/activity/outings"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-warm-strong)]"
        >
          ← 0원 나들이로
        </Link>
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          경로우대 <span className="text-[var(--color-warm-strong)]">교통카드</span> 발급
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          이 카드 한 장이면 전국 도시철도가 무료예요
        </p>
      </header>

      {/* hero */}
      <section className="hero-warm mx-5 mb-5 rounded-2xl p-5 text-white">
        <p className="text-[13px] font-medium text-white/85">📌 한 줄 요약</p>
        <h2 className="mt-1 text-[18px] font-extrabold leading-tight">
          만 65세 이상이시면 신분증 하나로 받으실 수 있어요
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
          <div className="rounded-xl bg-white/15 px-3 py-2.5">
            <p className="text-white/80">발급 대상</p>
            <p className="mt-0.5 font-bold">만 65세 이상</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2.5">
            <p className="text-white/80">준비물</p>
            <p className="mt-0.5 font-bold">신분증 1개</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2.5">
            <p className="text-white/80">발급처</p>
            <p className="mt-0.5 font-bold">주민센터·은행</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2.5">
            <p className="text-white/80">소요 시간</p>
            <p className="mt-0.5 font-bold">약 30분</p>
          </div>
        </div>
      </section>

      {/* 가는 길 체크 */}
      <section className="mx-5 mb-5 rounded-2xl border-2 border-[var(--color-warm)]/30 bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          ✅ 가시기 전 체크리스트
        </h2>
        <ul className="space-y-2">
          {CHECKLIST.map((c, i) => (
            <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[var(--color-border)] bg-white text-[12px]">
                ☐
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <a
          href="https://map.kakao.com/?q=%ED%96%89%EC%A0%95%EB%B3%B5%EC%A7%80%EC%84%BC%ED%84%B0"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-xl bg-[var(--color-warm)] py-3 text-center text-[15px] font-bold text-white"
        >
          📍 가까운 주민센터 찾기
        </a>
      </section>

      {/* FAQ 5개 */}
      <section className="mx-5 mb-5">
        <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
          💡 자주 묻는 질문
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <article
              key={i}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
            >
              <p className="text-[15px] font-bold text-[var(--color-text)]">{f.q}</p>
              <p className="mt-2 text-[14px] font-semibold text-[var(--color-warm-strong)]">
                → {f.a}
              </p>
              {f.sub && (
                <p
                  className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]"
                  style={{ wordBreak: "keep-all" }}
                >
                  {f.sub}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* 출처 */}
      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        ※ 도시철도 무임승차는 도시철도법 시행령 §46에 따라 만 65세 이상 모든 분께 적용됩니다.
        버스 적용 여부와 카드 종류(우대용 교통카드·복지카드 등)는 거주 시·도에 따라 다를 수 있으니
        주민센터에서 정확한 안내를 받아주세요.
      </p>

      <TabBar />
    </main>
  );
}
