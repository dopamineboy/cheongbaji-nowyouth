"use client";

// /welcome 하단 CTA — 약관 동의 3개 + "시작하기" 버튼
// 시니어 친화: 큰 체크박스(터치 영역 44pt+), "모두 동의" 토글, 각 항목 옆 자세히 링크
// 모두 동의 안 되면 시작 버튼 disabled.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ConsentKey = "terms" | "privacy" | "age";

const ITEMS: { key: ConsentKey; label: string; href?: string }[] = [
  { key: "terms", label: "이용약관에 동의합니다", href: "/terms" },
  { key: "privacy", label: "개인정보 수집·이용에 동의합니다", href: "/privacy" },
  { key: "age", label: "만 14세 이상이며 본인입니다" },
];

export default function ConsentCta() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<ConsentKey, boolean>>({
    terms: false,
    privacy: false,
    age: false,
  });

  const allChecked = ITEMS.every((it) => checked[it.key]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ terms: next, privacy: next, age: next });
  };

  const toggleOne = (k: ConsentKey) => {
    setChecked((c) => ({ ...c, [k]: !c[k] }));
  };

  const handleStart = () => {
    if (!allChecked) return;
    router.push("/onboarding");
  };

  return (
    <div className="mt-auto flex flex-col gap-3">
      {/* 약관 동의 카드 */}
      <div className="rounded-2xl border-2 border-[var(--color-primary)]/20 bg-white p-5 card-soft">
        {/* 모두 동의 */}
        <button
          type="button"
          onClick={toggleAll}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
            allChecked
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--bg-soft-blue)] text-[var(--color-text)]"
          }`}
          aria-pressed={allChecked}
        >
          <span
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-md border-2 text-[18px] font-extrabold ${
              allChecked
                ? "border-white bg-white text-[var(--color-primary)]"
                : "border-[var(--color-primary)]/40 bg-white text-transparent"
            }`}
            aria-hidden
          >
            ✓
          </span>
          <span className="text-[16px] font-extrabold">모두 동의합니다</span>
        </button>

        <div className="my-3 h-px bg-[var(--color-border)]" />

        {/* 개별 동의 */}
        <ul className="flex flex-col gap-2">
          {ITEMS.map((it) => {
            const on = checked[it.key];
            return (
              <li
                key={it.key}
                className="flex items-center justify-between gap-2"
              >
                <button
                  type="button"
                  onClick={() => toggleOne(it.key)}
                  className="flex flex-1 items-center gap-3 rounded-lg py-2 text-left"
                  aria-pressed={on}
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-md border-2 text-[18px] font-extrabold ${
                      on
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-white text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-[15px] font-bold text-[var(--color-text)]">
                    <span className="text-[var(--color-urgent)]">(필수)</span>{" "}
                    {it.label}
                  </span>
                </button>
                {it.href && (
                  <Link
                    href={it.href}
                    className="text-[13px] font-bold text-[var(--color-primary)] underline whitespace-nowrap"
                  >
                    자세히
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 시작 버튼 */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!allChecked}
        className="btn-primary block rounded-2xl py-5 text-center text-[19px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        1분 인터뷰 시작하기 →
      </button>

      <p className="text-center text-[12px] text-[var(--color-muted)]">
        만 65세 이상 어르신 · 가족·보호자 대리 신청 가능
        <br />
        입력 정보는 혜택 매칭에만 사용되며 안전하게 보관됩니다
      </p>
    </div>
  );
}
