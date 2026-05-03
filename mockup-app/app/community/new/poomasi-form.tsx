"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PoomasiCategory } from "../../lib/types";

const CATEGORIES: { value: PoomasiCategory; ko: string; icon: string; example: string }[] = [
  { value: "life_help", ko: "생활 도움", icon: "🏥", example: "병원 동행, 은행 업무" },
  { value: "house_chore", ko: "가사 커뮤니티", icon: "🍲", example: "김장, 청소, 이사" },
  { value: "digital", ko: "디지털 도움", icon: "📱", example: "스마트폰, 카카오톡" },
  { value: "talk", ko: "대화 상대", icon: "🚶", example: "산책, 차 한 잔" },
  { value: "skill_share", ko: "재능 나눔", icon: "🎨", example: "한글, 영어, 요리" },
  { value: "etc", ko: "기타", icon: "✨", example: "그 외 도움 요청" },
];

export default function PoomasiForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initCat = (params.get("category") as PoomasiCategory) ?? "life_help";
  const initTitle = params.get("prefill") ?? "";

  const [category, setCategory] = useState<PoomasiCategory>(initCat);
  const [title, setTitle] = useState(initTitle);
  const [body, setBody] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) {
      setError("제목을 3자 이상 적어주세요.");
      return;
    }
    if (body.trim().length < 5) {
      setError("내용을 5자 이상 적어주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/poomasi/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body, preferredTime }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "등록에 실패했어요.");
        setSubmitting(false);
        return;
      }
      router.push("/community");
      router.refresh();
    } catch {
      setError("네트워크 오류예요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* 카테고리 */}
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[var(--color-text)]">
          어떤 도움이 필요하세요?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-2xl p-4 text-left transition ${
                category === c.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <div className="text-2xl" aria-hidden>
                {c.icon}
              </div>
              <p className="mt-1 text-[16px] font-bold">{c.ko}</p>
              <p
                className={`mt-0.5 text-[12px] ${
                  category === c.value
                    ? "text-white/80"
                    : "text-[var(--color-muted)]"
                }`}
              >
                예: {c.example}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[var(--color-text)]">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 다음 주 화요일 종로보건소 같이 가실 분"
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          maxLength={60}
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[var(--color-text)]">
          내용
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="어떤 도움이 필요한지 편하게 적어주세요. 시간이나 장소도 함께 알려주시면 좋아요."
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          rows={5}
          maxLength={500}
        />
        <p className="mt-1 text-[12px] text-[var(--color-muted)]">
          금융·종교·후원 권유는 자동으로 차단돼요.
        </p>
      </div>

      {/* 희망 시간 */}
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[var(--color-text)]">
          희망 시간 (선택)
        </label>
        <input
          type="text"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          placeholder="예: 5월 6일(화) 오전 10시 / 평일 오후 아무 때"
          className="w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[16px]"
          maxLength={50}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-[var(--color-urgent)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-urgent)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl bg-[var(--color-primary)] py-4 text-[18px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "등록 중..." : "이웃에게 요청 보내기"}
      </button>
    </form>
  );
}
