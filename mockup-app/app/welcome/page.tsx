// 첫 진입 — 랜딩 / 환영 화면
import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-6 pb-10">
      {/* 상단 로고 영역 */}
      <header className="flex flex-col items-center pt-12 pb-6">
        <p className="text-[16px] font-medium text-[var(--color-muted)]">
          청춘은 바로 지금
        </p>
        <h1 className="mt-2 text-[64px] font-extrabold leading-none text-[var(--color-primary)]">
          청바지
        </h1>
        <p className="mt-3 text-[15px] text-[var(--color-muted)]">
          Now Is Youth · 시니어 라이프스타일 플랫폼
        </p>
      </header>

      {/* 가치 소개 4가지 */}
      <section className="mb-8 flex flex-col gap-3">
        <ValueRow
          icon="📋"
          title="복지 알리미"
          desc="모르고 지나치던 혜택을 자동으로 찾아드려요"
          tone="hero-blue"
        />
        <ValueRow
          icon="💼"
          title="일자리 매칭"
          desc="우리 동네 노인일자리를 100점 적합도로 추천"
          tone="hero-gold"
        />
        <ValueRow
          icon="💬"
          title="우리 동 품앗이"
          desc="이웃과 서로 도움 주고받는 안전한 커뮤니티"
          tone="hero-emerald"
        />
        <ValueRow
          icon="🎯"
          title="활동 리워드"
          desc="일상 활동이 포인트로 쌓여 작은 선물로"
          tone="hero-coral"
        />
      </section>

      {/* CTA */}
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/onboarding"
          className="btn-primary block rounded-2xl py-5 text-center text-[19px] font-bold"
        >
          처음이세요? 시작하기 →
        </Link>
        <Link
          href="/"
          className="block rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-center text-[16px] font-semibold text-[var(--color-text)]"
        >
          이미 가입했어요
        </Link>
        <p className="mt-2 text-center text-[12px] text-[var(--color-muted)]">
          만 65세 이상 어르신을 위한 서비스 · 가족·보호자 대리 신청 가능
        </p>
      </div>
    </main>
  );
}

function ValueRow({
  icon,
  title,
  desc,
  tone,
}: {
  icon: string;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <div className={`${tone} flex items-center gap-4 rounded-2xl px-5 py-4`}>
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[18px] font-extrabold leading-tight">{title}</p>
        <p className="mt-0.5 text-[13px] opacity-90">{desc}</p>
      </div>
    </div>
  );
}
