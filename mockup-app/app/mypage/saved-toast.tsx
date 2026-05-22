"use client";

// 마이페이지 항목별 저장 후 돌아왔을 때 작은 토스트.
// ?saved=<field> 쿼리를 읽어 한국어 라벨로 "저장됐어요" 안내. 5초 자동 dismiss.
// 사용자가 추가로 다른 항목 더 수정하도록 마이페이지에 머무는 게 의도.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function SavedToast() {
  const sp = useSearchParams();
  const saved = sp.get("saved");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setVisible(true);
    // URL 정리 (새로고침 시 재등장 방지)
    const t1 = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      window.history.replaceState({}, "", url.pathname + url.search);
    }, 200);
    const t2 = setTimeout(() => setVisible(false), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [saved]);

  if (!saved || !visible) return null;
  const label = FIELD_LABEL[saved] ?? "정보";

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border-2 border-[var(--color-success)]/40 bg-[var(--color-success)]/5 p-4"
    >
      <p className="text-[15px] font-bold text-[var(--color-text)]">
        ✓ {label} 저장됐어요
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[var(--color-muted)]">
        다른 항목을 더 수정하시거나, 아래{" "}
        <span className="font-bold text-[var(--color-text)]">
          ｢새 맞춤 추천 보기｣
        </span>{" "}
        버튼을 누르시면 바뀐 정보로 추천을 다시 받으실 수 있어요.
      </p>
    </div>
  );
}
