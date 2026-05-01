type Bar = {
  label: string;
  senior: number;
  general: number;
  note?: string;
};

const bars: Bar[] = [
  { label: "접근 수준", senior: 95.3, general: 100, note: "기기·인터넷 보유" },
  { label: "활용 역량", senior: 55.9, general: 100, note: "실제 서비스 이용 능력" },
  { label: "기본 활용", senior: 75.0, general: 100, note: "검색·문자·전화" },
  { label: "종합 지수", senior: 71.4, general: 100, note: "전체 평균" },
];

function BarRow({ b }: { b: Bar }) {
  const gap = (100 - b.senior).toFixed(1);
  const isCritical = b.senior < 60;
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <h3 className="text-[20px] font-bold text-[var(--color-text)]">{b.label}</h3>
          {b.note && (
            <p className="text-[13px] text-[var(--color-muted)]">{b.note}</p>
          )}
        </div>
        <span
          className={`text-[14px] font-semibold ${
            isCritical ? "text-[var(--color-urgent)]" : "text-[var(--color-muted)]"
          }`}
        >
          격차 −{gap}점
        </span>
      </div>
      <div className="relative">
        <div className="h-10 w-full rounded-lg bg-[var(--color-border)]/40">
          <div
            className={`flex h-full items-center justify-end rounded-lg pr-3 text-[15px] font-bold text-white ${
              isCritical ? "bg-[var(--color-urgent)]" : "bg-[var(--color-primary)]"
            }`}
            style={{ width: `${b.senior}%` }}
          >
            {b.senior.toFixed(1)}
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 text-[14px] font-semibold text-[var(--color-muted)]">
          100
        </div>
      </div>
    </div>
  );
}

export default function DigitalGapInfographic() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col bg-[var(--bg-page)] p-10">
      <header className="mb-8">
        <p className="text-[15px] font-semibold tracking-wide text-[var(--color-accent)]">
          시니어 디지털 역량 · NIA 2024
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-[var(--color-text)]">
          접속은 가능하나 <span className="text-[var(--color-urgent)]">활용은 불가</span>
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-muted)]">
          고령층(55세 이상)의 디지털정보화 수준, 일반국민=100 기준.
          스마트폰 보유율 94%+ vs 활용 역량 55.9점 — 약 40점의 구조적 격차.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-7 shadow-[0_4px_20px_rgba(26,63,107,0.06)]">
        {bars.map((b) => (
          <BarRow key={b.label} b={b} />
        ))}
      </section>

      <footer className="mt-6 flex items-center justify-between text-[13px] text-[var(--color-muted)]">
        <span>출처: 한국지능정보사회진흥원 디지털정보격차실태조사 (2024)</span>
        <span className="font-semibold text-[var(--color-primary)]">
          청바지(NowYouth)
        </span>
      </footer>
    </main>
  );
}
