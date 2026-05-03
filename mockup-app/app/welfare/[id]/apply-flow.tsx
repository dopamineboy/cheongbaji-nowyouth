"use client";

// 신청 흐름 — 서류 체크리스트 + 공식 신청 단계 가이드 + 안전 게이트
// MVP 의도: 자동 신청 X, 안내·체크·이동까지만. 마지막 제출은 본인이 직접.
import { useMemo, useState } from "react";

type DocGuide = { how: string; url?: string; urlLabel?: string };

interface ApplyFlowProps {
  benefitId: string;
  benefitName: string;
  documents: string[];
  docGuides: Record<string, DocGuide>;
  applyOnline?: { name: string; url: string };
  applyOffline?: string[];
}

// 혜택별 신청 단계 가이드 (정적 데이터, MVP)
// 실제 사이트 안 오버레이는 부담 크니 단계 안내만 (사용자 피드백 §4 의도)
const APPLY_STEPS: Record<string, { steps: string[]; tip?: string }> = {
  복지로: {
    steps: [
      "복지로(www.bokjiro.go.kr) 접속",
      "공동인증서·간편인증으로 로그인",
      "[서비스 신청 → 복지급여 신청] 메뉴 선택",
      "신청할 혜택 검색 후 선택",
      "안내에 따라 신청서 작성",
      "제출 전 입력 내용 한 번 더 확인",
      "✋ 마지막 제출 버튼은 직접 눌러주세요",
    ],
    tip: "공동인증서가 없으시면 행정복지센터 방문 신청을 권장드려요.",
  },
  정부24: {
    steps: [
      "정부24(www.gov.kr) 접속",
      "간편인증 또는 공동인증서로 로그인",
      "[서비스] 메뉴에서 신청 가능한 항목 검색",
      "신청서 작성",
      "필요 서류 첨부",
      "내용 확인",
      "✋ 마지막 제출 버튼은 직접 눌러주세요",
    ],
  },
  default: {
    steps: [
      "공식 사이트 접속",
      "본인 인증 (간편인증·공동인증서)",
      "신청 메뉴 진입",
      "신청서 작성",
      "필요 서류 첨부 또는 입력",
      "제출 전 입력 내용 확인",
      "✋ 마지막 제출 버튼은 직접 눌러주세요",
    ],
  },
};

export default function ApplyFlow({
  benefitId,
  benefitName,
  documents,
  docGuides,
  applyOnline,
  applyOffline,
}: ApplyFlowProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [showSafetyGate, setShowSafetyGate] = useState(false);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalDocs = documents.length;
  const allReady = totalDocs > 0 && checkedCount === totalDocs;
  const progressPct = totalDocs > 0 ? Math.round((checkedCount / totalDocs) * 100) : 0;

  const guide = useMemo(() => {
    const channel = applyOnline?.name ?? "";
    return APPLY_STEPS[channel] ?? APPLY_STEPS.default;
  }, [applyOnline]);

  const toggle = (doc: string) =>
    setChecked((prev) => ({ ...prev, [doc]: !prev[doc] }));

  const shareToFamily = () => {
    const text = `[청바지] ${benefitName} 신청 준비\n\n필요 서류:\n${documents
      .map((d) => `${checked[d] ? "✅" : "⬜"} ${d}`)
      .join("\n")}\n\n신청처: ${applyOnline?.name ?? applyOffline?.[0] ?? "행정복지센터"}\n\n도움 부탁드려요.`;
    if (navigator.share) {
      navigator
        .share({ title: `${benefitName} 신청 준비`, text })
        .catch(() => navigator.clipboard.writeText(text));
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("준비 내용을 복사했어요. 가족에게 붙여넣기로 공유해주세요."))
        .catch(() => alert("공유를 지원하지 않는 브라우저예요."));
    }
  };

  const openOfficialSite = () => {
    if (!applyOnline) return;
    setShowSafetyGate(false);
    window.open(applyOnline.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* 1. 서류 체크리스트 진행 게이지 */}
      {totalDocs > 0 && (
        <section className="mx-5 mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
            <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-success)]" />
            서류 준비 체크리스트
          </h2>
          <div className="rounded-2xl border-2 border-[var(--color-border)] bg-white p-5">
            {/* 진행 게이지 */}
            <div className="mb-4">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[14px] font-bold text-[var(--color-text)]">
                  준비 완료 {checkedCount} / {totalDocs}
                </p>
                <p className="text-[14px] font-bold text-[var(--color-primary)]">
                  {progressPct}%
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="h-full bg-[var(--color-success)] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {allReady && (
                <p className="mt-2 text-[13px] font-bold text-[var(--color-success)]">
                  🎉 모든 서류가 준비됐어요. 이제 공식 신청을 진행하세요.
                </p>
              )}
            </div>

            {/* 체크박스 + 발급 가이드 */}
            <ul className="flex flex-col gap-2">
              {documents.map((doc) => {
                const g = docGuides[doc];
                const isChecked = !!checked[doc];
                return (
                  <li
                    key={doc}
                    className={`rounded-xl border-2 p-3 transition ${
                      isChecked
                        ? "border-[var(--color-success)] bg-[var(--color-success)]/5"
                        : "border-[var(--color-border)] bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(doc)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[14px] font-extrabold ${
                          isChecked
                            ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                            : "border-[var(--color-border)] bg-white text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <div className="flex-1">
                        <p
                          className={`text-[15px] font-bold ${
                            isChecked
                              ? "text-[var(--color-success)] line-through"
                              : "text-[var(--color-text)]"
                          }`}
                          style={{ wordBreak: "keep-all" }}
                        >
                          {doc}
                        </p>
                        {g && (
                          <p
                            className="mt-1 text-[12px] leading-relaxed text-[var(--color-muted)]"
                            style={{ wordBreak: "keep-all" }}
                          >
                            {g.how}
                          </p>
                        )}
                      </div>
                    </button>
                    {g?.url && (
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-[12px] font-bold text-[var(--color-primary)]"
                      >
                        {g.urlLabel ?? "발급 바로가기"} →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* 보조 액션 */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={shareToFamily}
                className="rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-3 text-[14px] font-bold text-[var(--color-text)]"
              >
                👨‍👩‍👧 가족에게 공유
              </button>
              <a
                href={`https://map.kakao.com/?q=${encodeURIComponent("행정복지센터")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 border-[var(--color-border)] bg-white px-3 py-3 text-center text-[14px] font-bold text-[var(--color-text)]"
              >
                📍 가까운 주민센터
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 2. 공식 신청 경로 가이드 (펼쳐보기) */}
      <section className="mx-5 mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold text-[var(--color-text)]">
          <span className="inline-block h-5 w-2 rounded-full bg-[var(--color-primary)]" />
          공식 신청 경로
        </h2>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-[var(--color-border)] bg-white p-5 text-left"
        >
          <div>
            <p className="text-[15px] font-bold text-[var(--color-text)]">
              {applyOnline?.name ?? "공식 사이트"}에서 신청하는 방법
            </p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              {guide.steps.length}단계 안내 · 막히지 않게 옆에서 도와드려요
            </p>
          </div>
          <span className="text-[20px] text-[var(--color-primary)]">
            {showGuide ? "▴" : "▾"}
          </span>
        </button>

        {showGuide && (
          <div className="mt-3 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--bg-soft-blue)] p-5">
            <ol className="flex flex-col gap-3">
              {guide.steps.map((step, i) => {
                const isFinal = step.includes("✋");
                return (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                        isFinal
                          ? "bg-[var(--color-urgent)] text-white"
                          : "bg-[var(--color-primary)] text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <p
                      className={`text-[14px] leading-snug ${
                        isFinal ? "font-extrabold text-[var(--color-urgent)]" : "text-[var(--color-text)]"
                      }`}
                      style={{ wordBreak: "keep-all" }}
                    >
                      {step.replace("✋ ", "")}
                    </p>
                  </li>
                );
              })}
            </ol>
            {guide.tip && (
              <p className="mt-4 rounded-lg bg-white p-3 text-[12px] leading-relaxed text-[var(--color-text)]">
                💡 {guide.tip}
              </p>
            )}
          </div>
        )}

        {applyOffline && applyOffline.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <p className="mb-2 text-[14px] font-bold text-[var(--color-text)]">
              직접 방문 신청 (가장 안전한 방법)
            </p>
            <ul className="space-y-1.5">
              {applyOffline.map((place, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[14px] leading-relaxed"
                >
                  <span className="shrink-0 text-[var(--color-primary)]">📍</span>
                  <span>{place}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-muted)]">
              방문하시면 담당자가 자격 확인부터 신청서 작성까지 도와드려요.
            </p>
          </div>
        )}
      </section>

      {/* 3. 신청 액션 — 안전 게이트 */}
      <section className="mx-5 mb-8 flex flex-col gap-3">
        {applyOnline && (
          <button
            type="button"
            onClick={() => setShowSafetyGate(true)}
            className="btn-primary block rounded-2xl py-5 text-center text-[17px] font-bold"
          >
            {applyOnline.name}에서 신청하러 가기 → (+100P)
          </button>
        )}
        <p className="text-center text-[12px] leading-relaxed text-[var(--color-muted)]">
          청바지는 신청을 대신해드리지 않습니다.
          <br />
          공식 사이트로 이동하면 본인이 직접 마지막 제출 버튼을 눌러주세요.
        </p>
      </section>

      {/* 안전 게이트 모달 */}
      {showSafetyGate && applyOnline && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-3 text-center text-4xl">🔒</div>
            <h3 className="mb-2 text-center text-[20px] font-extrabold text-[var(--color-text)]">
              {applyOnline.name}으로 이동합니다
            </h3>
            <p
              className="mb-5 text-center text-[14px] leading-relaxed text-[var(--color-muted)]"
              style={{ wordBreak: "keep-all" }}
            >
              청바지는 신청을 대신해드리지 않아요.
              <br />
              <span className="font-bold text-[var(--color-text)]">
                마지막 제출 버튼은 본인이 직접
              </span>{" "}
              눌러주셔야 합니다.
            </p>
            <ul className="mb-5 space-y-2 rounded-xl bg-[var(--bg-soft-yellow)] p-4 text-[13px] leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[var(--color-success)]">✓</span>
                <span>본인 인증은 본인이 직접 진행해주세요</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-success)]">✓</span>
                <span>입력하신 정보가 정확한지 확인 후 제출하세요</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-success)]">✓</span>
                <span>의심스러운 추가 결제·이체 요청은 모두 거절</span>
              </li>
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSafetyGate(false)}
                className="flex-1 rounded-2xl border-2 border-[var(--color-border)] bg-white py-4 text-[15px] font-bold text-[var(--color-text)]"
              >
                다시 보기
              </button>
              <button
                type="button"
                onClick={openOfficialSite}
                className="btn-primary flex-1 rounded-2xl py-4 text-[15px] font-bold"
              >
                확인했어요 · 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* benefitId는 향후 분석 이벤트 트래킹용 */}
      <span hidden data-benefit-id={benefitId} />
    </>
  );
}
