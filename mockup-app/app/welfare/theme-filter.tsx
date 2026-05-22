"use client";

// 복지 혜택 페이지 상단 테마 그리드 — "빠른 점프(anchor)" 역할.
// 모든 테마 섹션은 페이지 안에 처음부터 펼쳐져 있고, 그리드 타일을 누르면
// 같은 페이지에서 해당 테마 섹션(id="theme-<id>")으로 부드럽게 스크롤.
//
// 더 이상 ?theme= 쿼리 필터를 쓰지 않음 — 정보가 한 페이지에 다 보이는 게
// 시니어 사용자에게 더 명확하다고 판단.
import { THEMES, type ThemeId } from "../lib/welfare/themes";

interface Props {
  /** 매칭 결과의 테마별 건수 — 0인 테마는 회색 처리 */
  counts: Record<ThemeId, number>;
  /** 전체 총 건수 */
  totalCount: number;
}

function scrollToTheme(id: ThemeId) {
  const el = document.getElementById(`theme-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ThemeFilter({ counts, totalCount }: Props) {
  return (
    <section className="px-5 pb-4">
      <h2 className="mb-2 text-[17px] font-extrabold text-[var(--color-text)]">
        🔎 테마로 골라보기
      </h2>
      <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-muted)]">
        궁금하신 테마를 누르시면 그 분야 혜택으로 바로 이동해요.
        <span className="ml-1 font-semibold text-[var(--color-text)]">
          (총 {totalCount}건)
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => {
          const c = counts[t.id] ?? 0;
          const disabled = c === 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollToTheme(t.id)}
              disabled={disabled}
              aria-label={`${t.label} ${c}건 — 해당 섹션으로 이동`}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3.5 text-center transition ${
                disabled
                  ? "bg-white/60 border border-dashed border-[var(--color-border)] text-[var(--color-muted)]/60 cursor-not-allowed"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-text)] active:bg-[var(--color-primary)]/5 card-soft"
              }`}
            >
              <span className="text-[28px] leading-none" aria-hidden>
                {t.icon}
              </span>
              <span className="mt-1 text-[13px] font-bold leading-tight">
                {t.label}
              </span>
              <span
                className={`mt-0.5 text-[12px] font-bold ${
                  disabled ? "text-[var(--color-muted)]/60" : "text-[var(--color-primary)]"
                }`}
              >
                {c}건
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
