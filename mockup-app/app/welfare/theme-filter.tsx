"use client";

// 복지 혜택 페이지 상단 테마 그리드 + 칩.
//   - 필터 해제 상태(첫 진입): 큰 4열 그리드 타일로 카테고리 입구를 명확히 노출
//     (시니어가 "여기를 누르면 그 테마만 볼 수 있어요"라는 affordance를 즉시 인지)
//   - 필터 활성 상태: 칩 한 줄 + "전체" 버튼만 (스크롤 영역 절약)
//   - 0건 테마는 비활성화 (회색)
//
// URL ?theme=medical 쿼리 파라미터로 동기화 → 새로고침/공유 시 유지.
import { useRouter, useSearchParams } from "next/navigation";
import { THEMES, type ThemeId } from "../lib/welfare/themes";

interface Props {
  /** 매칭 결과의 테마별 건수 — 0인 테마는 회색 처리 */
  counts: Record<ThemeId, number>;
  /** 전체(필터 해제) 시 보여줄 총 건수 */
  totalCount: number;
}

export default function ThemeFilter({ counts, totalCount }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const active = (sp.get("theme") ?? null) as ThemeId | null;

  const setTheme = (id: ThemeId | null) => {
    const params = new URLSearchParams(sp.toString());
    if (id === null) params.delete("theme");
    else params.set("theme", id);
    router.replace(`/welfare${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  // ── 필터 활성: 작은 칩 줄만 노출 + "전체 ←" 큰 버튼
  if (active) {
    return (
      <section className="px-5 pb-4">
        <button
          type="button"
          onClick={() => setTheme(null)}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-[14px] font-bold text-[var(--color-text)] active:bg-[var(--color-primary)]/5"
        >
          ← 전체 테마로
        </button>
        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {THEMES.map((t) => {
            const c = counts[t.id] ?? 0;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                disabled={c === 0}
                aria-pressed={isActive}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-bold transition ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow"
                    : c === 0
                    ? "bg-white text-[var(--color-muted)]/50 border border-[var(--color-border)] cursor-not-allowed"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)] active:bg-[var(--color-primary)]/5"
                }`}
              >
                <span className="mr-1" aria-hidden>{t.icon}</span>
                {t.label}
                <span className={`ml-1.5 text-[12px] font-semibold ${isActive ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // ── 필터 해제 상태: 큰 4열 그리드 타일로 카테고리 입구 노출
  return (
    <section className="px-5 pb-4">
      <h2 className="mb-3 text-[17px] font-extrabold text-[var(--color-text)]">
        🔎 테마로 골라보기
      </h2>
      <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-muted)]">
        궁금하신 테마를 누르시면 해당 분야 혜택만 모아 보여드려요.
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
              onClick={() => setTheme(t.id)}
              disabled={disabled}
              aria-label={`${t.label} ${c}건 보기`}
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
