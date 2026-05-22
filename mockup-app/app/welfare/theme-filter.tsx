"use client";

// 복지 혜택 페이지 테마 선택 UI.
//
// 두 가지 모드:
//   ① 비활성(첫 진입): 큰 3열 그리드 — 사용자가 자기 관심 테마를 능동 선택
//   ② 활성(?theme=ID): sticky 작은 칩 줄 — 항상 화면 상단에 보여서 다른 테마로
//     빠르게 점프 가능. 다시 그리드로 가지 않아도 됨.
//
// URL ?theme= 쿼리로 server-side 렌더링 동기화 (page.tsx가 해당 테마만 그림).
//
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { THEMES, type ThemeId } from "../lib/welfare/themes";

interface Props {
  /** 매칭 결과의 테마별 건수 — 0인 테마는 회색 처리 */
  counts: Record<ThemeId, number>;
}

export default function ThemeFilter({ counts }: Props) {
  const sp = useSearchParams();
  const active = (sp.get("theme") ?? null) as ThemeId | null;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 활성 칩이 가로 스크롤 영역의 가운데로 자동 이동 — 사용자가 화면 밖에 있는
  // 활성 칩을 못 보는 문제 해소.
  useEffect(() => {
    if (!active || !scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector(
      `[data-theme-id="${active}"]`,
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [active]);

  // ── 활성 모드: sticky 그리드 (스크롤해도 화면 상단에 따라옴, 11개 한 화면)
  if (active) {
    // 0건 테마는 sticky에서 숨김 — 누를 일 없으니 공간 절약
    const visibleThemes = THEMES.filter((t) => (counts[t.id] ?? 0) > 0);
    return (
      <div className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--bg-page)]/95 px-3 py-2 backdrop-blur">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="text-[12px] font-bold text-[var(--color-muted)]">
            다른 테마 바로 가기
          </p>
          <Link
            href="/welfare"
            className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-[12px] font-bold text-[var(--color-text)] active:bg-[var(--color-primary)]/5"
          >
            ✕ 전체 테마로
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {visibleThemes.map((t) => {
            const c = counts[t.id] ?? 0;
            const isActive = active === t.id;
            return (
              <Link
                key={t.id}
                href={`/welfare?theme=${t.id}`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[12px] font-bold leading-tight ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow"
                    : "bg-white text-[var(--color-text)] border border-[var(--color-border)] active:bg-[var(--color-primary)]/5"
                }`}
              >
                <span className="text-[15px] leading-none" aria-hidden>
                  {t.icon}
                </span>
                <span className="truncate">{t.label}</span>
                <span className={`shrink-0 ${isActive ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                  {c}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 비활성(첫 진입): 큰 3열 그리드
  return (
    <section className="px-5 pb-4">
      <h2 className="mb-2 text-[19px] font-extrabold text-[var(--color-text)]">
        🔎 어떤 분야부터 보실까요?
      </h2>
      <p className="mb-4 text-[13px] leading-relaxed text-[var(--color-muted)]">
        궁금하신 테마를 한 번 눌러보세요. 그 분야 혜택만 모아 보여드려요.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => {
          const c = counts[t.id] ?? 0;
          const disabled = c === 0;
          if (disabled) {
            return (
              <div
                key={t.id}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/60 px-2 py-4 text-center text-[var(--color-muted)]/60"
              >
                <span className="text-[28px] leading-none opacity-50" aria-hidden>
                  {t.icon}
                </span>
                <span className="mt-1 text-[13px] font-bold leading-tight">
                  {t.label}
                </span>
                <span className="mt-0.5 text-[12px] font-bold">0건</span>
              </div>
            );
          }
          return (
            <Link
              key={t.id}
              href={`/welfare?theme=${t.id}`}
              scroll={false}
              aria-label={`${t.label} ${c}건 보기`}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--color-border)] bg-white px-2 py-4 text-center text-[var(--color-text)] card-soft active:bg-[var(--color-primary)]/5"
            >
              <span className="text-[30px] leading-none" aria-hidden>
                {t.icon}
              </span>
              <span className="mt-1 text-[14px] font-bold leading-tight">
                {t.label}
              </span>
              <span className="mt-0.5 text-[13px] font-bold text-[var(--color-primary)]">
                {c}건
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
