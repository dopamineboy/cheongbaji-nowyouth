// 첫 진입 — 설득력 있는 랜딩 + 인터뷰 시작 게이트
import Link from "next/link";
import { isOnboarded } from "../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  // 이미 온보딩한 사용자는 홈으로
  if (await isOnboarded()) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col px-6 pb-10">
      {/* 로고 */}
      <header className="flex flex-col items-center pt-10 pb-6">
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청춘은 바로 지금
        </p>
        <h1 className="mt-2 text-[60px] font-extrabold leading-none text-[var(--color-primary)]">
          청바지
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-muted)]">
          Now Is Youth · 시니어 라이프스타일
        </p>
      </header>

      {/* Hero — 강력한 한 줄 */}
      <section className="hero-blue mb-5 rounded-3xl px-6 py-7 text-center">
        <p className="text-[15px] font-medium text-white/85">
          어르신 한 분당 평균
        </p>
        <p className="mt-1 text-[36px] font-extrabold leading-tight">
          월 약 130만원
        </p>
        <p className="mt-1 text-[16px] font-semibold text-white/90">
          받을 수 있는 혜택을 놓치지 마세요
        </p>
        <p className="mt-3 text-[12px] text-white/70">
          * 주거급여·생계급여·기초연금·바우처 등 종합 추정
        </p>
      </section>

      {/* 신뢰 stats */}
      <section className="mb-5 grid grid-cols-3 gap-2 text-center">
        <Stat number="25" unit="개" label="복지 제도" />
        <Stat number="115만" unit="개" label="노인일자리" />
        <Stat number="100%" unit="" label="무료" />
      </section>

      {/* 4대 가치 */}
      <section className="mb-5 flex flex-col gap-3">
        <ValueRow
          icon="📋"
          title="복지 알리미"
          desc="모르고 지나치던 혜택을 자동 매칭"
          tone="hero-blue"
        />
        <ValueRow
          icon="💼"
          title="일자리 매칭"
          desc="우리 동네 일자리 100점 적합도 추천"
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

      {/* 왜 청바지인가 */}
      <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 card-soft">
        <h3 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          왜 청바지인가요?
        </h3>
        <ul className="space-y-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          <li>
            <span className="font-bold text-[var(--color-text)]">✓ 공공데이터 기반</span>
            {" — "}복지로·노인인력개발원 공식 자료 자동 동기화
          </li>
          <li>
            <span className="font-bold text-[var(--color-text)]">✓ 시니어 친화 UX</span>
            {" — "}큰 글씨·음성 안내·보호자 대리 신청 가능
          </li>
          <li>
            <span className="font-bold text-[var(--color-text)]">✓ 안전 우선</span>
            {" — "}금전 거래 차단·신원 인증·사회복지사 모니터링
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/onboarding"
          className="btn-primary block rounded-2xl py-5 text-center text-[19px] font-bold"
        >
          1분 인터뷰 시작하기 →
        </Link>
        <p className="text-center text-[12px] text-[var(--color-muted)]">
          만 65세 이상 어르신 · 가족·보호자 대리 신청 가능
          <br />
          입력 정보는 혜택 매칭에만 사용되며 안전하게 보관됩니다
        </p>
      </div>
    </main>
  );
}

function Stat({
  number,
  unit,
  label,
}: {
  number: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-2 py-4 card-soft">
      <p className="text-[24px] font-extrabold leading-none text-[var(--color-primary)]">
        {number}
        <span className="text-[14px] font-bold">{unit}</span>
      </p>
      <p className="mt-1 text-[12px] text-[var(--color-muted)]">{label}</p>
    </div>
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
