"use client";

// 마이페이지 항목을 수정 → 저장 시 홈으로 redirect되면서 ?updated=<field> 쿼리가 붙는다.
// 이 컴포넌트는 그 쿼리를 읽어 한국어 라벨로 토스트를 띄우고, 6초 후 자동으로 사라진다.
// (URL에서 쿼리도 제거해 새로고침해도 다시 안 뜨도록 함)
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FIELD_LABEL: Record<string, string> = {
  name: "이름",
  birth: "출생 정보",
  region: "시·도",
  district: "시·군·구",
  household: "가구 정보",
  income: "월 소득",
  welfare: "복지 상태",
  housing: "주거 형태",
  disability: "장애 등록",
  veteran: "국가유공자",
  youngChild: "영유아 가구원",
  jobTypes: "선호 활동 유형",
  pastOccupations: "이전 직종",
  timeSlots: "선호 시간대",
  hourlyWage: "희망 시급",
  outdoor: "야외 활동",
  walkingHeavy: "도보 많은 일",
  driving: "운전 가능",
};

export default function ProfileUpdateToast() {
  const router = useRouter();
  const sp = useSearchParams();
  const updated = sp.get("updated");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!updated) return;
    setVisible(true);
    // URL에서 쿼리 제거 (새로고침 시 토스트 재등장 방지) — 토스트 자체는 state로 유지
    const t1 = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.pathname + url.search);
    }, 200);
    const t2 = setTimeout(() => setVisible(false), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updated, router]);

  if (!updated || !visible) return null;

  const label = FIELD_LABEL[updated] ?? "정보";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-[448px] justify-center px-5"
    >
      <div className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border-2 border-[var(--color-primary)]/40 bg-white px-4 py-3 shadow-lg card-soft">
        <span className="mt-0.5 text-[20px]" aria-hidden>
          ✅
        </span>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[var(--color-text)]">
            {label} 저장 완료
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-muted)]">
            바뀐 정보로 맞춤 추천을 다시 계산했어요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="알림 닫기"
          className="-m-1 rounded-full p-1 text-[18px] leading-none text-[var(--color-muted)]"
        >
          ×
        </button>
      </div>
    </div>
  );
}
