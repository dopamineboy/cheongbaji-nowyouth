// 첫 진입 — 설득력 있는 랜딩 + 인터뷰 시작 게이트
import { isOnboarded } from "../lib/auth";
import { redirect } from "next/navigation";
import ConsentCta from "./consent-cta";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  // 이미 온보딩한 사용자는 홈으로
  if (await isOnboarded()) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col px-6 pb-10">
      {/* 약자 풀이 — 청·바·지 + 춘은·로·금 */}
      <header className="flex flex-col items-center pt-12 pb-8">
        <div className="flex items-baseline gap-1.5">
          {[
            { acro: "청", rest: "춘은" },
            { acro: "바", rest: "로" },
            { acro: "지", rest: "금" },
          ].map((p, i) => (
            <div key={i} className="contents">
              {/* 약자 글자 + 풀이 한 칸 */}
              <div className="flex flex-col items-center">
                <span className="text-[68px] font-black leading-none text-[var(--color-primary)]">
                  {p.acro}
                </span>
                <span className="mt-1 text-[18px] font-bold text-[var(--color-text)]">
                  {p.rest}
                </span>
              </div>
              {/* 단어 사이 점 */}
              {i < 2 && (
                <span className="self-start pt-6 text-[28px] font-bold text-[var(--color-primary)]/35">
                  ·
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 풀어쓴 슬로건 — 작게 부연 */}
        <p className="mt-5 text-[16px] font-bold tracking-wide text-[var(--color-muted)]">
          = 청춘은 바로 지금 =
        </p>

        {/* 영문 부제 */}
        <p className="mt-2 text-[12px] font-medium tracking-wide text-[var(--color-muted)]">
          Now Is Youth · 시니어 라이프스타일
        </p>
      </header>

      {/* Hero — 후킹 + 안전 톤 (과장 리스크 회피) */}
      <section className="hero-blue mb-5 rounded-3xl px-6 py-7 text-center">
        <p className="text-[15px] font-medium leading-snug text-white/90">
          조건에 따라 받을 수 있는
          <br />
          복지·일자리 혜택을
        </p>
        <p className="mt-2 text-[28px] font-extrabold leading-tight">
          1분 만에 확인
        </p>
        <p className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[13px] font-semibold">
          최대 월 130만원 상당의 지원 가능성 점검
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-white/70">
          * 주거급여·생계급여·기초연금·바우처 등 종합 추정 범위
          <br />
          실제 수급 금액은 소득·재산·가구 형태에 따라 달라집니다
        </p>
      </section>

      {/* 신뢰 stats — MVP 범위 명시 (작아 보이지 않게 확장 계획 표시) */}
      <section className="mb-5 grid grid-cols-3 gap-2 text-center">
        <Stat number="25" unit="개+" label="MVP 핵심 제도" />
        <Stat number="115만" unit="개" label="노인일자리" />
        <Stat number="100%" unit="" label="무료" />
      </section>
      <p className="-mt-3 mb-5 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
        향후 복지로·공공데이터 기반 360종+ 자동 매칭 확장
      </p>

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
          title="우리 동 커뮤니티"
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

      {/* CTA — 약관 동의 + 시작하기 (client component) */}
      <ConsentCta />
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
