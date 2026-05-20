"use client";

// 시니어 친화 신청 방법 안내 모달
// /training 코스 카드의 "신청 방법 보기" 버튼 클릭 시 펼침.
// 단계별 가이드 + 정부 지원 안내 + 외부 사이트 열기 큰 버튼 + 문의 전화.

import { useEffect, useState } from "react";
import {
  buildApplyGuide,
  supportLabel,
  type TrainingCourse,
} from "../lib/training/courses";

interface ApplyGuideModalProps {
  course: TrainingCourse;
}

export default function ApplyGuideModal({ course }: ApplyGuideModalProps) {
  const [open, setOpen] = useState(false);
  const guide = buildApplyGuide(course);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 모달 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 block w-full rounded-xl border-2 border-[var(--color-primary)] bg-white py-3 text-center text-[15px] font-bold text-[var(--color-primary)]"
        aria-label={`${course.name} 신청 방법 자세히 보기`}
      >
        📖 신청 방법 자세히 보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${course.name} 신청 방법`}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-[480px] flex-col rounded-t-3xl bg-white sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <header className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex-1">
                <p className="text-[12px] font-bold text-[var(--color-muted)]">
                  신청 방법 안내
                </p>
                <h3 className="mt-0.5 text-[17px] font-extrabold leading-tight text-[var(--color-text)]">
                  {course.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--bg-page)] text-[20px] font-bold text-[var(--color-text)]"
                aria-label="닫기"
              >
                ✕
              </button>
            </header>

            {/* 본문 — 스크롤 */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* 정부 지원 요약 */}
              <section className="mb-5 rounded-2xl bg-[var(--bg-soft-blue)] border-2 border-[var(--color-primary)]/20 p-4">
                <p className="text-[13px] font-bold text-[var(--color-muted)]">
                  💰 적용 가능한 정부 지원
                </p>
                <p className="mt-1 text-[16px] font-extrabold text-[var(--color-text)]">
                  {supportLabel(guide.primarySupport)}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text)]">
                  본인부담금:{" "}
                  <strong className="text-[var(--color-success)]">
                    {course.feeKrw === 0
                      ? "0원 (정부 지원으로 무료)"
                      : `${course.feeKrw.toLocaleString()}원`}
                  </strong>
                  <br />
                  교육 기간: {course.duration}
                </p>
              </section>

              {/* 단계별 안내 */}
              <section className="mb-5">
                <h4 className="mb-3 text-[18px] font-extrabold text-[var(--color-text)]">
                  📝 이렇게 신청하세요
                </h4>
                <ol className="flex flex-col gap-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-[16px] font-extrabold text-white">
                        {i + 1}
                      </span>
                      <p className="flex-1 pt-1 text-[15px] leading-relaxed text-[var(--color-text)]">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              {/* 시니어 우대 안내 */}
              <section className="mb-5 rounded-xl bg-[var(--bg-soft-yellow)] border border-[var(--color-accent)]/40 p-4">
                <p className="text-[14px] font-bold text-[var(--color-text)]">
                  ✨ 60세 이상 어르신 혜택
                </p>
                <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-[var(--color-text)]">
                  <li>• 대부분 자격증 응시료 면제 또는 50% 감면</li>
                  <li>• 본인부담금 면제 또는 우선 배정</li>
                  <li>• 신청서 작성 어려우면 가족·보호자 대리 신청 가능</li>
                </ul>
              </section>

              {/* 도움 요청 */}
              <section className="mb-2 rounded-xl border border-[var(--color-border)] bg-[var(--bg-page)] p-4">
                <p className="text-[13px] font-bold text-[var(--color-text)]">
                  ❓ 신청이 어려우시면
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
                  가까운 <strong>고용복지플러스센터</strong> 또는{" "}
                  <strong>주민센터</strong>에 방문하시면 직원이 신청을 도와드려요.
                  국번 없이 <strong>☎ 1350</strong> (고용노동부 상담)으로 전화하셔도
                  됩니다.
                </p>
              </section>
            </div>

            {/* 하단 액션 — 큰 버튼 2개 */}
            <footer className="flex flex-col gap-2 border-t border-[var(--color-border)] px-5 py-4">
              <a
                href={course.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-[var(--color-primary)] py-4 text-center text-[17px] font-extrabold text-white"
                onClick={() => setOpen(false)}
              >
                공식 사이트에서 신청하기 →
              </a>
              {course.contactPhone && (
                <a
                  href={`tel:${course.contactPhone.replace(/[^\d]/g, "")}`}
                  className="block w-full rounded-2xl border-2 border-[var(--color-primary)] bg-white py-4 text-center text-[17px] font-extrabold text-[var(--color-primary)]"
                >
                  ☎ {course.contactPhone} 전화하기
                </a>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-1 w-full rounded-xl py-2 text-center text-[14px] font-bold text-[var(--color-muted)]"
              >
                닫기
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
