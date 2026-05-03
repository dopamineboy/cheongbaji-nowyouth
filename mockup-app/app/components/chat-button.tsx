"use client";

// AI 챗봇 — OpenAI 스트리밍 + 음성 입력(STT) + 음성 출력(TTS) + 빠른 질문 칩
// STT/TTS는 브라우저 내장 Web Speech API 사용 (추가 비용 0, 한국어 지원)
// iOS Safari는 SpeechRecognition 미지원 — 마이크 버튼 자동 숨김
import { useState, useRef, useEffect, useCallback } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: { icon: string; text: string }[] = [
  { icon: "📋", text: "내가 받을 수 있는 복지 혜택 알려줘" },
  { icon: "💼", text: "우리 동네 일자리 추천해줘" },
  { icon: "🎓", text: "무료로 들을 수 있는 교육 알려줘" },
  { icon: "🎯", text: "활동 포인트는 어떻게 모아?" },
];

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
        "안녕하세요, 청바지 도우미예요. 복지·일자리·커뮤니티·활동, 옆에서 같이 봐드릴게요. 무엇이든 편하게 물어보시면 돼요. 마이크 버튼을 누르시면 말로도 가능해요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false); // 응답 자동 읽기
  const [recording, setRecording] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // SpeechRecognition 초기화 (브라우저 내장)
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSttSupported(false);
      return;
    }
    setSttSupported(true);
    const r = new SR();
    r.lang = "ko-KR";
    r.interimResults = true;
    r.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInput(final || interim);
    };
    r.onend = () => setRecording(false);
    r.onerror = () => setRecording(false);
    recognitionRef.current = r;
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  // 컴포넌트 언마운트/닫기 시 음성 정리
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // TTS — 응답 텍스트 읽기
  const speak = useCallback(
    (text: string) => {
      if (
        !voiceOut ||
        !text ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      )
        return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    },
    [voiceOut],
  );

  // 마이크 토글
  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      try {
        setInput("");
        recognitionRef.current.start();
        setRecording(true);
      } catch {
        // 이미 실행 중이거나 시작 실패 — 무시
      }
    }
  };

  const send = async (rawQ?: string) => {
    const q = (rawQ ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }

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
      // 응답 완료 시 음성 출력
      speak(acc);
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

  // 닫을 때 음성 정리
  const handleClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }
    setOpen(false);
  };

  // 첫 인사뿐일 때만 빠른 질문 칩 노출
  const showQuickPrompts = msgs.length === 1 && !streaming;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[var(--color-primary)] pl-4 pr-5 text-white shadow-lg sm:right-[calc(50%-220px)]"
        aria-label="AI 도우미 열기"
      >
        <span className="text-[22px]" aria-hidden>
          💬
        </span>
        <span className="text-[15px] font-bold">도우미</span>
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (voiceOut && typeof window !== "undefined") {
                  window.speechSynthesis?.cancel();
                }
                setVoiceOut(!voiceOut);
              }}
              aria-label={voiceOut ? "음성 읽기 끄기" : "음성 읽기 켜기"}
              title={voiceOut ? "음성 읽기 끄기" : "음성 읽기 켜기"}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] ${
                voiceOut
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:bg-[var(--bg-page)]"
              }`}
            >
              {voiceOut ? "🔊" : "🔇"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[20px] text-[var(--color-muted)] hover:bg-[var(--bg-page)]"
            >
              ✕
            </button>
          </div>
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

            {/* 빠른 질문 — 첫 진입 시만 */}
            {showQuickPrompts && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="px-1 text-[12px] font-medium text-[var(--color-muted)]">
                  이런 게 궁금하시면 눌러보세요
                </p>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(p.text)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left text-[14px] text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--bg-soft-blue)]"
                  >
                    <span className="text-xl" aria-hidden>
                      {p.icon}
                    </span>
                    <span className="flex-1 leading-snug">{p.text}</span>
                    <span className="text-[var(--color-muted)]" aria-hidden>
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
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
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  recording
                    ? "🎤 듣고 있어요…"
                    : "예: 에너지바우처 어떻게 신청해요?"
                }
                disabled={streaming}
                className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-[15px] disabled:opacity-50 ${
                  recording
                    ? "border-[var(--color-urgent)]"
                    : "border-[var(--color-border)]"
                } ${sttSupported ? "pr-12" : ""}`}
              />
              {sttSupported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={streaming}
                  aria-label={recording ? "음성 입력 중단" : "음성으로 말하기"}
                  title={recording ? "음성 입력 중단" : "음성으로 말하기"}
                  className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[18px] transition disabled:opacity-40 ${
                    recording
                      ? "animate-pulse bg-[var(--color-urgent)] text-white"
                      : "bg-[var(--bg-page)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white"
                  }`}
                >
                  🎤
                </button>
              )}
            </div>
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
