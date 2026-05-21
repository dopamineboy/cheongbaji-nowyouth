"use client";

// 옛 사용자가 마이페이지에 들어오면 자동으로 위치 정보를 한 번 동기화한다.
// (region은 "부산광역시"인데 lat/lng가 서울 좌표로 남아있는 케이스 — server에서 stale 감지)
//
// 동작:
//   1. mount 시 1회 fetch("/api/profile/update", { body: "{}" })
//   2. profile/update가 stale 감지하면 resolveLocation으로 lat/lng 재계산 + cookie 갱신
//   3. 그 후 router.refresh()로 서버 캐시 무효화 → 새 추천 즉시 반영
//   4. 사용자에게 작은 토스트로 "📍 위치 정보를 새 좌표로 동기화했어요" 안내
//
// 이미 stale이 아닌 사용자는 빈 body로 와도 lat/lng 갱신 안 됨 (그냥 noop).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoMigrateLocation() {
  const router = useRouter();
  const fired = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let cancelled = false;

    void (async () => {
      try {
        await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (cancelled) return;
        // 서버에서 revalidatePath가 이미 호출됨 — client refresh로 완전 동기화
        router.refresh();
        setDone(true);
        // 4초 후 토스트 자동 숨김
        setTimeout(() => {
          if (!cancelled) setDone(false);
        }, 4000);
      } catch {
        // 네트워크 오류는 조용히 무시 — 다음 진입 때 재시도됨
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!done) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border-2 border-[var(--color-primary)]/40 bg-[var(--bg-soft-blue)] p-3"
    >
      <p className="text-[13px] font-bold text-[var(--color-text)]">
        📍 위치 정보를 새 좌표로 동기화했어요
      </p>
      <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-muted)]">
        마이페이지의 시·도·시·군·구 기준으로 맞춤 추천을 다시 계산했습니다.
      </p>
    </div>
  );
}
