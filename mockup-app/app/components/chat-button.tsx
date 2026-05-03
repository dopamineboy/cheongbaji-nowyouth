"use client";

// AI 챗봇 — OpenAI 스트리밍 응답
// 키 없으면 서버에서 [데모 모드] 안내 텍스트 반환
import { useState, useRef, useEffect } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

async function resetOnboarding() {
  if (!confirm("인터뷰를 다시 진행하시겠어요? 현재 입력 정보는 초기화돼요."))
    return;
  await fetch("/api/onboarding/complete", { method: "DELETE" });
  window.location.href = "/welcome";
}

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "안녕하세요, 청바지 도우미예요. 복지·일자리·커뮤니티·포인트에 대해 무엇이든 물어보세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  const send = async () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");
    const newMsgs: Msg[] = [
      ...msgs,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ];
    setMsgs(newMsgs);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.slice(0, -1).filter((m) => m.content),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        setMsgs((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `오류: ${errText.slice(0, 200)}`,
          };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: acc };
          return updated;
        });
      }
    } catch (e) {
      setMsgs((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `네트워크 오류가 발생했어요: ${e}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl text-white shadow-lg sm:right-[calc(50%-220px)]"
        aria-label="AI 도우미 열기"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="relative flex max-h-[85vh] w-full max-w-[448px] flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <div>
            <p className="text-[12px] text-[var(--color-muted)]">청바지 도우미</p>
            <h3 className="text-[16px] font-bold text-[var(--color-text)]">
              궁금한 거 물어보세요
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded-full p-2 text-[20px] text-[var(--color-muted)] hover:bg-[var(--bg-page)]"
          >
            ✕
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[var(--color-primary)] text-white"
                    : "bg-[var(--bg-page)] text-[var(--color-text)]"
                }`}
              >
                {m.content || (
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)] [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)] [animation-delay:0.4s]" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 에너지바우처 어떻게 신청해요?"
              disabled={streaming}
              className="flex-1 rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[15px] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="rounded-xl bg-[var(--color-primary)] px-5 text-[15px] font-bold text-white disabled:opacity-40"
            >
              {streaming ? "..." : "보내기"}
            </button>
          </form>
          <button
            type="button"
            onClick={resetOnboarding}
            className="mt-2 block w-full text-center text-[11px] text-[var(--color-muted)] underline"
          >
            인터뷰 다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}
