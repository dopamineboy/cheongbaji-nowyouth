type Axis = {
  number: string;
  title: string;
  subtitle: string;
  stats: { value: string; label: string; source: string }[];
  color: "primary" | "accent" | "urgent";
};

const axes: Axis[] = [
  {
    number: "1",
    title: "복지 수급 격차",
    subtitle: "받아야 할 혜택이 전달되지 않는다",
    color: "primary",
    stats: [
      { value: "42.2만", label: "기초연금 사각지대 (명)", source: "보건복지부 2024" },
      { value: "38.1%", label: "노인빈곤율 (OECD 평균의 3배)", source: "OECD 2023" },
      { value: "8.2%", label: "문화누리카드 미사용률 (70세+)", source: "국민권익위 2024" },
    ],
  },
  {
    number: "2",
    title: "생산활동 단절",
    subtitle: "은퇴 후 10년의 소득 공백",
    color: "accent",
    stats: [
      { value: "10년", label: "소득 크레바스 (주된 일자리 퇴직 52.9세 → 연금 63세)", source: "통계청 2025" },
      { value: "69.4%", label: "계속 근로 희망 (55~79세)", source: "통계청 2025" },
      { value: "40.0%", label: "65세+ 고용률 (OECD 1위)", source: "고용노동부 2026" },
    ],
  },
  {
    number: "3",
    title: "플랫폼 부재",
    subtitle: "시니어 중심 디지털 서비스 없음",
    color: "urgent",
    stats: [
      { value: "55.9점", label: "고령층 디지털 활용 역량", source: "NIA 2024" },
      { value: "39.4점", label: "접근(95.3) vs 역량(55.9) 격차", source: "NIA 2024" },
      { value: "94%+", label: "고령층 스마트폰 보유율", source: "NIA 2024" },
    ],
  },
];

const colorMap = {
  primary: {
    bg: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
    ring: "border-[var(--color-primary)]",
  },
  accent: {
    bg: "bg-[var(--color-accent)]",
    text: "text-[#8A5E00]",
    ring: "border-[var(--color-accent)]",
  },
  urgent: {
    bg: "bg-[var(--color-urgent)]",
    text: "text-[var(--color-urgent)]",
    ring: "border-[var(--color-urgent)]",
  },
};

function AxisCard({ a }: { a: Axis }) {
  const c = colorMap[a.color];
  return (
    <article
      className={`relative rounded-2xl border-2 bg-white p-6 ${c.ring}`}
    >
      <div className="mb-4 flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${c.bg} text-[28px] font-extrabold text-white`}
        >
          {a.number}
        </div>
        <div>
          <h3 className={`text-[22px] font-extrabold leading-tight ${c.text}`}>
            {a.title}
          </h3>
          <p className="mt-1 text-[14px] text-[var(--color-muted)]">
            {a.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        {a.stats.map((s, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className={`w-[90px] text-[20px] font-extrabold ${c.text}`}>
              {s.value}
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[var(--color-text)]">
                {s.label}
              </p>
              <p className="text-[12px] text-[var(--color-muted)]">
                {s.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function ThreeAxisInfographic() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[900px] flex-col bg-[var(--bg-page)] p-10">
      <header className="mb-8 text-center">
        <p className="text-[15px] font-semibold tracking-wide text-[var(--color-accent)]">
          65세 이상 1,024만 명 · 초고령사회 진입 (2024.11)
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-[var(--color-text)]">
          시니어가 겪는 <span className="text-[var(--color-primary)]">3대 구조적 격차</span>
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-muted)]">
          인구 증가에도 실제 생활 문제는 해결되지 않았다.
          복지·활동·플랫폼의 세 축에서 격차가 오히려 심화되고 있다.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {axes.map((a) => (
          <AxisCard key={a.number} a={a} />
        ))}
      </section>

      <footer className="mt-8 rounded-2xl bg-[var(--color-primary)] p-6 text-center text-white">
        <p className="text-[15px] text-white/80">통합 해결 방향</p>
        <p className="mt-2 text-[20px] font-extrabold">
          세 격차를 하나의 플랫폼에서 해결 · 청바지(NowYouth)
        </p>
      </footer>

      <p className="mt-4 text-center text-[12px] text-[var(--color-muted)]">
        출처: 보건복지부·통계청·OECD·국민권익위·국회입법조사처·NIA·고용노동부 공식 통계 (2023~2026)
      </p>
    </main>
  );
}
