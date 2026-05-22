"use client";

// 복지 상세 페이지의 "← 이전으로" 버튼.
// 사용자가 어디서 들어왔든(테마 그리드/홈/마이페이지/한시지원) 정확히 직전 페이지로 복귀.
//
// 동작 우선순위:
//   1. 브라우저 history가 있으면 router.back() — 정확한 직전 페이지
//   2. history 없으면(새 탭으로 직접 진입 등) fallbackHref로 push
//
import { useRouter } from "next/navigation";

interface Props {
  /** history 없을 때(새 탭/공유 링크 진입) 폴백할 경로 */
  fallbackHref: string;
}

export default function BackButton({ fallbackHref }: Props) {
  const router = useRouter();

  const goBack = () => {
    // window.history.length가 1보다 크면 직전 페이지가 있음.
    // (단, 일부 브라우저는 새 탭에서도 2를 줄 수 있어 referrer도 보조 검사)
    const sameOriginReferrer =
      typeof document !== "undefined" &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (typeof window !== "undefined" && window.history.length > 1 && sameOriginReferrer) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
    >
      ← 이전으로
    </button>
  );
}
