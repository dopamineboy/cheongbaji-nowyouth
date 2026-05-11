"use client";

// 섹션별 안내영상 모달 — "안내영상 보기" 버튼 클릭 시 모달로 mp4 재생
// 호스팅: GitHub Releases (videos-v1 태그) — Vercel CDN의 stale 404 캐시 우회 +
// Vercel deployment 크기 제약에서 자유로움. public repo의 release asset은 anonymous 접근 가능.
// 시니어 사용자 친화: 큰 버튼·큰 닫기·자동재생 안 함(사용자 의도 명확할 때만 재생)

import { useEffect, useRef, useState } from "react";

interface GuideVideoButtonProps {
  /** GitHub Release videos-v1의 asset 이름 — "jobs" | "activity" | "community" */
  src: "jobs" | "activity" | "community";
  /** 섹션 이름 (예: "일자리") — 버튼·헤더 표시용 */
  label: string;
}

// GitHub Releases 호스팅된 영상 URL
const VIDEO_BASE =
  "https://github.com/dopamineboy/cheongbaji-nowyouth/releases/download/videos-v1";

export default function GuideVideoButton({ src, label }: GuideVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 모달 열릴 때 영상 자동 재생(사용자가 클릭했으니 의도 명확)
  // 닫힐 때는 일시정지 + 처음으로 리셋
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.play().catch(() => {
        // 자동재생 차단 시 사용자가 직접 컨트롤로 재생하도록 두기
      });
    } else {
      v.pause();
    }
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border-2 border-[var(--color-primary)] bg-white px-4 py-3 text-[15px] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
        aria-label={`${label} 안내영상 보기`}
      >
        <span aria-hidden className="text-[18px]">▶</span>
        안내영상 보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${label} 안내영상`}
        >
          <div
            className="relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
              <h3 className="text-[17px] font-extrabold text-[var(--color-text)]">
                {label} 안내영상
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-page)] text-[20px] font-bold text-[var(--color-text)] hover:bg-[var(--color-border)]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <video
              ref={videoRef}
              src={`${VIDEO_BASE}/${src}.mp4`}
              controls
              playsInline
              preload="metadata"
              className="block h-auto w-full bg-black"
            >
              브라우저가 영상을 지원하지 않습니다. 최신 Chrome·Safari를 사용해주세요.
            </video>
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-[16px] font-bold text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
