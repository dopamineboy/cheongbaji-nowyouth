// 주간 포인트 적립 차트 — SVG 막대그래프 (서버 컴포넌트)
import type { LedgerEntry } from "../lib/types";

function dayKey(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WeeklyChart({ ledger }: { ledger: LedgerEntry[] }) {
  // 최근 7일 적립 합계 (양수만)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ label: dayKey(d), total: 0 });
  }
  for (const e of ledger) {
    if (e.amount <= 0) continue;
    const d = new Date(e.createdAt);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff >= 0 && diff < 7) {
      days[6 - diff].total += e.amount;
    }
  }

  const max = Math.max(50, ...days.map((d) => d.total));
  const width = 320;
  const height = 140;
  const barW = (width - 30) / 7;
  const padding = 25;

  return (
    <div className="card-soft rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[18px] font-bold text-[var(--color-text)]">
          주간 적립 추이
        </h3>
        <span className="text-[13px] text-[var(--color-muted)]">최근 7일</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B7DFF" />
            <stop offset="100%" stopColor="#2855F0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padding}
            x2={width - 5}
            y1={padding + (height - padding) * (1 - p)}
            y2={padding + (height - padding) * (1 - p)}
            stroke="#F0E2C9"
            strokeDasharray="2 4"
            strokeWidth={0.5}
          />
        ))}
        {days.map((d, i) => {
          const h = ((height - padding) * d.total) / max;
          return (
            <g key={i}>
              <rect
                x={padding + i * barW + 4}
                y={padding + (height - padding) - h}
                width={barW - 8}
                height={Math.max(2, h)}
                rx={4}
                fill={d.total > 0 ? "url(#bar-grad)" : "#F0E2C9"}
              />
              {d.total > 0 && (
                <text
                  x={padding + i * barW + barW / 2}
                  y={padding + (height - padding) - h - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#2855F0"
                  fontWeight="700"
                >
                  {d.total}
                </text>
              )}
              <text
                x={padding + i * barW + barW / 2}
                y={height + 12}
                textAnchor="middle"
                fontSize="10"
                fill="#5A5A5A"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[13px] text-[var(--color-muted)]">
        이번 주 총 {days.reduce((a, b) => a + b.total, 0).toLocaleString()}P 적립
      </p>
    </div>
  );
}
