"use client";

// 복지 혜택 페이지 상단 테마 칩 필터.
// URL ?theme=medical 같은 쿼리 파라미터로 동기화 → 새로고침해도 선택 유지 + 공유 가능.
//
// 큰 칩 + 큰 활성 표시(시니어 가독성). 한 줄에 못 들어가면 가로 스크롤.
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
  const active = (sp.get("theme") ?? "all") as ThemeId | "all";

  const setTheme = (id: ThemeId | "all") => {
    const params = new URLSearchParams(sp.toString());
    if (id === "all") params.delete("theme");
    else params.set("theme", id);
    // scroll: false 로 위치 유지 + replace로 history 안 쌓이게
    router.replace(`/welfare${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  return (
    <div className="px-5 pb-4">
      <p className="mb-2 text-[13px] font-bold text-[var(--color-muted)]">
        테마로 골라보기
      </p>
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        <Chip
          active={active === "all"}
          icon="📋"
          label="전체"
          count={totalCount}
          onClick={() => setTheme("all")}
        />
        {THEMES.map((t) => {
          const c = counts[t.id] ?? 0;
          return (
            <Chip
              key={t.id}
              active={active === t.id}
              icon={t.icon}
              label={t.label}
              count={c}
              disabled={c === 0}
              onClick={() => setTheme(t.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  active,
  icon,
  label,
  count,
  disabled,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-bold transition ${
        active
          ? "bg-[var(--color-primary)] text-white shadow"
          : disabled
          ? "bg-white text-[var(--color-muted)]/50 border border-[var(--color-border)] cursor-not-allowed"
          : "bg-white text-[var(--color-text)] border border-[var(--color-border)] active:bg-[var(--color-primary)]/5"
      }`}
      aria-pressed={active}
    >
      <span className="mr-1" aria-hidden>
        {icon}
      </span>
      {label}
      <span
        className={`ml-1.5 text-[12px] font-semibold ${
          active ? "text-white/80" : "text-[var(--color-muted)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
