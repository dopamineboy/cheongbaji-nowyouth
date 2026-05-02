"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reset = async () => {
    if (!confirm("온보딩 + 프로필 쿠키를 모두 삭제할까요?")) return;
    setBusy("reset");
    await fetch("/api/onboarding/complete", { method: "DELETE" });
    setMessage("쿠키 삭제 완료. 다음 진입 시 인터뷰가 다시 시작돼요.");
    setBusy(null);
    setTimeout(() => router.refresh(), 1000);
  };

  const triggerIngest = async () => {
    setBusy("ingest");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`수집 완료: 최종 ${data.data.finalCount}건`);
      } else {
        setMessage(`실패: ${data.error?.message ?? "알 수 없음"}`);
      }
    } catch (e) {
      setMessage(`네트워크 오류: ${e}`);
    } finally {
      setBusy(null);
      router.refresh();
    }
  };

  return (
    <section className="card-soft rounded-2xl bg-white p-5">
      <h2 className="mb-3 text-[18px] font-bold text-[var(--color-text)]">
        액션
      </h2>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={busy !== null}
          className="rounded-xl border-2 border-[var(--color-urgent)] bg-white py-3 text-[15px] font-bold text-[var(--color-urgent)] disabled:opacity-50"
        >
          {busy === "reset" ? "처리 중..." : "🔄 세션 리셋 (인터뷰 다시)"}
        </button>
        <button
          type="button"
          onClick={triggerIngest}
          disabled={busy !== null}
          className="btn-primary rounded-xl py-3 text-[15px] font-bold disabled:opacity-50"
        >
          {busy === "ingest" ? "수집 중..." : "🔃 일자리 즉시 갱신 (KORDI)"}
        </button>
      </div>
      {message && (
        <p className="mt-3 rounded-xl bg-[var(--color-success)]/10 p-3 text-center text-[14px] font-semibold text-[var(--color-success)]">
          {message}
        </p>
      )}
    </section>
  );
}
