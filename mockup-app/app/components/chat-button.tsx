"use client";

// AI 챗봇 — OpenAI 스트리밍 + 음성 입력(STT) + 음성 출력(TTS) + 빠른 질문 칩
//          + 위치 4코너 선택 (localStorage 영구) + 잠시 숨기기 (sessionStorage)
//          + 4대 기능 통합 컨텍스트 + 액션 카드 파싱 ([[/path|label]])
//          + 현재 페이지 경로 전송 (사용자가 보고 있는 화면 인식)
//          + 페이지별 동적 빠른 질문 칩 (usePathname 기반)
// STT/TTS는 브라우저 내장 Web Speech API 사용 (추가 비용 0, 한국어 지원)
// iOS Safari는 SpeechRecognition 미지원 — 마이크 버튼 자동 숨김
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

// 챗봇 응답 텍스트를 파싱해서 두 종류 액션 마크업을 추출, 본문은 따로 분리
//   1. [[/path|label]]                    — 의도된 마크업
//   2. navigate("/path", "label")          — LLM이 가끔 도구 호출 대신 텍스트로 적는 케이스 fallback
//   3. navigate(/path, "label") 변형 등도 흡수
function parseMessage(text: string): {
  body: string;
  actions: { href: string; label: string }[];
} {
  const actions: { href: string; label: string }[] = [];

  // 1. 정상 마크업 [[/path|label]]
  const cardRe = /\[\[(\/[^|\]]+)\|([^\]]+)\]\]/g;
  let body = text.replace(cardRe, (_m, href: string, label: string) => {
    actions.push({ href: href.trim(), label: label.trim() });
    return "";
  });

  // 2. navigate("/path", "reason") — 텍스트로 새어 나온 함수 호출 코드 fallback
  const navRe =
    /navigate\s*\(\s*["'`]?(\/[^"'`,)]+)["'`]?\s*,\s*["'`]([^"'`]+)["'`]\s*\)/g;
  body = body.replace(navRe, (_m, href: string, label: string) => {
    actions.push({ href: href.trim(), label: label.trim() });
    return "";
  });

  return { body: body.trim(), actions };
}

interface AgentStage {
  // 에이전트 흐름 단계 — 사용자에게 진행 상황 시각화
  // running: 진행 중 / done: 완료 / error: 실패
  label: string;
  state: "running" | "done" | "error";
  summary?: string; // 완료 시 결과 요약 (예: "일자리 5건 찾았어요")
  icon: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  stages?: AgentStage[];
}

const STAGE_ICON: Record<string, string> = {
  thinking: "🔍",
  tool_call: "📋",
  tool_result: "✓",
  answering: "✍️",
};

type Corner = "br" | "bl" | "tr" | "tl";

const CORNER_CLASS: Record<Corner, string> = {
  br: "bottom-24 right-4 sm:right-[calc(50%-220px)]",
  bl: "bottom-24 left-4 sm:left-[calc(50%-220px)]",
  tr: "top-6 right-4 sm:right-[calc(50%-220px)]",
  tl: "top-6 left-4 sm:left-[calc(50%-220px)]",
};

const CORNER_LABEL: Record<Corner, { ko: string; arrow: string }> = {
  tl: { ko: "왼쪽 위", arrow: "↖" },
  tr: { ko: "오른쪽 위", arrow: "↗" },
  bl: { ko: "왼쪽 아래", arrow: "↙" },
  br: { ko: "오른쪽 아래", arrow: "↘" },
};

// Prompt: text(클릭 칩 라벨) + href(이동 경로) 항상 페어
// — 사용자가 메뉴 못 찾을 때 도우미가 빠른 이동 단축키 역할
type Prompt = { icon: string; text: string; href: string };

// 현재 페이지에 맞춰 가장 도움 될 다른 영역 4곳을 빠른 이동 칩으로 노출
function getPromptsByPath(path: string | null): Prompt[] {
  if (!path) return DEFAULT_PROMPTS;

  // 복지 상세 (/welfare/[id])
  if (path.startsWith("/welfare/")) {
    return [
      { icon: "📋", text: "다른 복지 혜택 보러가기", href: "/welfare" },
      { icon: "💼", text: "관련 일자리 매칭 보기", href: "/jobs" },
      { icon: "🎓", text: "무료 연계 교육 보기", href: "/training" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 복지 목록 (/welfare)
  if (path === "/welfare") {
    return [
      { icon: "💼", text: "일자리 매칭 보러가기", href: "/jobs" },
      { icon: "🎓", text: "무료 연계 교육 보러가기", href: "/training" },
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
      { icon: "💬", text: "우리 동 커뮤니티", href: "/community" },
    ];
  }

  // 일자리 상세 (/jobs/[id])
  if (path.startsWith("/jobs/")) {
    return [
      { icon: "💼", text: "다른 추천 일자리 보기", href: "/jobs" },
      { icon: "🎓", text: "이 일에 도움되는 무료 교육", href: "/training" },
      { icon: "📋", text: "복지 알리미 보기", href: "/welfare" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 일자리 목록 (/jobs)
  if (path === "/jobs") {
    return [
      { icon: "🎓", text: "무료 연계 교육 보러가기", href: "/training" },
      { icon: "📋", text: "복지 알리미 보러가기", href: "/welfare" },
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
      { icon: "💬", text: "우리 동 커뮤니티", href: "/community" },
    ];
  }

  // 무료 연계 교육 (/training)
  if (path === "/training") {
    return [
      { icon: "💼", text: "일자리 매칭 보러가기", href: "/jobs" },
      { icon: "📋", text: "복지 알리미 보러가기", href: "/welfare" },
      { icon: "🎯", text: "활동 리워드 보기", href: "/activity" },
      { icon: "💬", text: "우리 동 커뮤니티", href: "/community" },
    ];
  }

  // 0원 나들이 코스 상세
  if (path.startsWith("/activity/outings/")) {
    return [
      { icon: "🌳", text: "다른 코스 보러가기", href: "/activity/outings" },
      { icon: "🪪", text: "교통카드 발급 안내", href: "/activity/transport-card" },
      { icon: "🎬", text: "문화누리카드 추천 활동", href: "/activity/culture" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 0원 나들이 목록
  if (path === "/activity/outings") {
    return [
      { icon: "🪪", text: "교통카드 발급 안내", href: "/activity/transport-card" },
      { icon: "🎬", text: "문화누리카드 추천 활동", href: "/activity/culture" },
      { icon: "🎯", text: "활동 리워드 보기", href: "/activity" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 문화누리카드
  if (path === "/activity/culture") {
    return [
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
      { icon: "🪪", text: "교통카드 발급 안내", href: "/activity/transport-card" },
      { icon: "📋", text: "문화누리카드 신청 방법", href: "/welfare/culture-voucher" },
      { icon: "🎯", text: "활동 리워드 보기", href: "/activity" },
    ];
  }
  // 교통카드 발급
  if (path === "/activity/transport-card") {
    return [
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
      { icon: "🎬", text: "문화누리카드 추천 활동", href: "/activity/culture" },
      { icon: "🎯", text: "활동 리워드 보기", href: "/activity" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 활동 메인 (/activity)
  if (path === "/activity") {
    return [
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
      { icon: "🎬", text: "문화누리카드 추천 활동", href: "/activity/culture" },
      { icon: "🪪", text: "교통카드 발급 안내", href: "/activity/transport-card" },
      { icon: "🎁", text: "포인트로 교환하기", href: "/rewards" },
    ];
  }

  // 커뮤니티 글 작성
  if (path === "/community/new") {
    return [
      { icon: "💬", text: "다른 요청글 보러가기", href: "/community" },
      { icon: "📋", text: "복지 알리미 보기", href: "/welfare" },
      { icon: "💼", text: "일자리 매칭 보기", href: "/jobs" },
      { icon: "🏠", text: "홈으로", href: "/" },
    ];
  }
  // 커뮤니티 (/community)
  if (path === "/community") {
    return [
      { icon: "✍️", text: "도움 요청글 작성하기", href: "/community/new" },
      { icon: "📋", text: "복지 알리미 보기", href: "/welfare" },
      { icon: "💼", text: "일자리 매칭 보기", href: "/jobs" },
      { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
    ];
  }

  // welcome / onboarding — 인터뷰 미완료 사용자는 이동 칩 의미 약함, 기본 유지
  if (path === "/welcome" || path.startsWith("/onboarding")) {
    return DEFAULT_PROMPTS;
  }

  // 홈(/) 또는 그 외 — 4대 영역 + 0원 나들이로 이동
  return DEFAULT_PROMPTS;
}

const DEFAULT_PROMPTS: Prompt[] = [
  { icon: "📋", text: "복지 알리미 보러가기", href: "/welfare" },
  { icon: "💼", text: "일자리 매칭 보러가기", href: "/jobs" },
  { icon: "🎓", text: "무료 연계 교육 보러가기", href: "/training" },
  { icon: "🌳", text: "0원 나들이 추천 보기", href: "/activity/outings" },
];

async function resetOnboarding() {
  if (!confirm("인터뷰를 다시 진행하시겠어요? 현재 입력 정보는 초기화돼요."))
    return;
  await fetch("/api/onboarding/complete", { method: "DELETE" });
  window.location.href = "/welcome";
}

export default function ChatButton() {
  const pathname = usePathname();
  const router = useRouter();
  const prompts = getPromptsByPath(pathname);
  const [open, setOpen] = useState(false);
  const [navHint, setNavHint] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [corner, setCorner] = useState<Corner>("br");
  const [hidden, setHidden] = useState(false);
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

  // 위치/숨김 상태 복원 (localStorage = 영구 / sessionStorage = 새로고침까지)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCorner = localStorage.getItem("cb_chat_corner") as Corner | null;
    if (savedCorner && CORNER_CLASS[savedCorner]) setCorner(savedCorner);
    if (sessionStorage.getItem("cb_chat_hidden") === "1") setHidden(true);
  }, []);

  const setCornerSaved = (c: Corner) => {
    setCorner(c);
    if (typeof window !== "undefined") localStorage.setItem("cb_chat_corner", c);
  };

  const hideTemporary = () => {
    setHidden(true);
    setShowOptions(false);
    setOpen(false);
    if (typeof window !== "undefined")
      sessionStorage.setItem("cb_chat_hidden", "1");
  };

  const showAgain = () => {
    setHidden(false);
    if (typeof window !== "undefined")
      sessionStorage.removeItem("cb_chat_hidden");
  };

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
      { role: "assistant", content: "", stages: [] },
    ];
    setMsgs(newMsgs);
    setStreaming(true);

    // 현재 응답 메시지에 단계 추가 (running) — 완료 시 done으로 전환
    const updateLast = (mut: (m: Msg) => Msg) =>
      setMsgs((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = mut(updated[updated.length - 1]);
        return updated;
      });

    const addStage = (stage: AgentStage) =>
      updateLast((m) => ({ ...m, stages: [...(m.stages ?? []), stage] }));

    const completeAllStagesAndPrev = () =>
      updateLast((m) => ({
        ...m,
        stages: (m.stages ?? []).map((s) =>
          s.state === "running" ? { ...s, state: "done" as const } : s,
        ),
      }));

    try {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.slice(0, -1).filter((m) => m.content),
          currentPath,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        updateLast(() => ({
          role: "assistant",
          content: `오류: ${errText.slice(0, 200)}`,
        }));
        setStreaming(false);
        return;
      }

      // SSE 파서 — `event: <name>\ndata: <json>\n\n` 형식
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accAnswer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          let eventName = "message";
          const dataLines: string[] = [];
          for (const line of chunk.split("\n")) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
          }
          if (dataLines.length === 0) continue;
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataLines.join("\n"));
          } catch {
            continue;
          }

          if (eventName === "status") {
            const stage = data.stage as string;
            const label = (data.label as string) ?? stage;
            if (stage === "tool_result") {
              // 같은 도구의 tool_call을 done으로 전환 + summary 첨부
              const toolName = data.name as string;
              const summary = data.summary as string | undefined;
              updateLast((m) => ({
                ...m,
                stages: (m.stages ?? []).map((s) =>
                  s.state === "running" && s.label.includes(label)
                    ? { ...s, state: "done", summary }
                    : s,
                ),
              }));
            } else {
              // thinking / tool_call / answering — 새 단계 추가
              completeAllStagesAndPrev();
              addStage({
                label,
                state: "running",
                icon: STAGE_ICON[stage] ?? "•",
              });
            }
          } else if (eventName === "navigate") {
            // 에이전트가 페이지 이동 결정 — 짧은 안내 후 즉시 router.push
            const path = (data.path as string) ?? "/";
            const reason = (data.reason as string) ?? "안내드릴게요";
            setNavHint(`📍 ${reason}`);
            // 모달은 닫고 라우터로 이동 (chatbot 답변 토큰까지 받지 않고 즉시)
            // 사용자가 인지할 수 있게 짧은 텀(500ms) 후 이동
            setTimeout(() => {
              setNavHint(null);
              handleClose();
              router.push(path);
            }, 700);
          } else if (eventName === "answer_delta") {
            const delta = (data.delta as string) ?? "";
            accAnswer += delta;
            updateLast((m) => ({ ...m, content: accAnswer }));
          } else if (eventName === "answer") {
            // answer_delta 못 받았을 때 폴백 (또는 최종 보정)
            const content = (data.content as string) ?? "";
            if (content && !accAnswer) {
              accAnswer = content;
              updateLast((m) => ({ ...m, content }));
            }
          } else if (eventName === "done") {
            completeAllStagesAndPrev();
          } else if (eventName === "error") {
            const message = (data.message as string) ?? "오류";
            updateLast((m) => ({
              ...m,
              content: m.content || `오류: ${message}`,
            }));
          }
        }
      }
      // 응답 완료 시 음성 출력 — 본문만 읽고 액션 카드 마크업은 제외
      if (accAnswer) speak(parseMessage(accAnswer).body);
    } catch (e) {
      updateLast(() => ({
        role: "assistant",
        content: `네트워크 오류가 발생했어요: ${e}`,
      }));
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
    setShowOptions(false);
    setOpen(false);
  };

  // 챗봇 내부 대화 — 이전 메시지 / 처음부터
  // "이전 메시지": 마지막 user-assistant 페어 제거 (한 단계 뒤로)
  // "처음부터": 첫 인사만 남기고 모두 초기화 (새 대화)
  const INITIAL_GREETING: Msg = {
    role: "assistant",
    content:
      "안녕하세요, 청바지 도우미예요. 복지·일자리·커뮤니티·활동, 옆에서 같이 봐드릴게요. 무엇이든 편하게 물어보시면 돼요. 마이크 버튼을 누르시면 말로도 가능해요.",
    stages: [],
  };

  const goBackInChat = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMsgs((prev) => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      // 마지막 user-assistant 페어 제거 (assistant가 마지막이면 둘 다 제거)
      while (next.length > 1) {
        const popped = next.pop();
        if (popped?.role === "user") break;
      }
      return next.length === 0 ? [INITIAL_GREETING] : next;
    });
  };

  const resetChat = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }
    setMsgs([INITIAL_GREETING]);
    setInput("");
    setNavHint(null);
    setShowOptions(false);
  };

  // 첫 인사뿐일 때만 빠른 질문 칩 노출
  const showQuickPrompts = msgs.length === 1 && !streaming;

  // 환영(/welcome)·인터뷰(/onboarding) 화면에서는 도우미 버튼 숨김 — 첫 진입 흐름 방해 방지
  if (pathname === "/welcome" || pathname === "/onboarding") return null;

  // 잠시 숨김 상태 — 작은 핀만 노출 (현재 코너 기준)
  if (hidden) {
    return (
      <button
        type="button"
        onClick={showAgain}
        className={`fixed ${CORNER_CLASS[corner]} z-40 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/50 text-[14px] text-white shadow opacity-70 transition hover:opacity-100`}
        aria-label="AI 도우미 다시 보기"
        title="도우미 다시 보기 (눌러주세요)"
      >
        💬
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed ${CORNER_CLASS[corner]} z-40 flex h-14 items-center gap-2 rounded-full bg-[var(--color-primary)] pl-4 pr-5 text-white shadow-lg`}
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
              onClick={() => setShowOptions(!showOptions)}
              aria-label={showOptions ? "옵션 닫기" : "위치·숨기기 옵션"}
              title="위치·숨기기 옵션"
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] ${
                showOptions
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)] hover:bg-[var(--bg-page)]"
              }`}
            >
              ⚙
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

        {/* 에이전트 라우팅 안내 — navigate 이벤트 도착 시 0.7초 노출 후 자동 이동 */}
        {navHint && (
          <div className="border-b border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-3 text-center">
            <p className="text-[14px] font-bold text-[var(--color-primary)]">
              {navHint}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--color-primary)]/70">
              잠시 후 페이지로 이동합니다
            </p>
          </div>
        )}

        {/* 옵션 패널 — 위치 변경 + 잠시 숨기기 */}
        {showOptions && (
          <div className="border-b border-[var(--color-border)] bg-[var(--bg-page)] p-4">
            <p className="mb-2 text-[13px] font-bold text-[var(--color-text)]">
              📍 도우미 버튼 위치
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCornerSaved(c)}
                  className={`rounded-xl py-3 text-[14px] font-bold transition ${
                    corner === c
                      ? "bg-[var(--color-primary)] text-white"
                      : "border-2 border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  {CORNER_LABEL[c].arrow} {CORNER_LABEL[c].ko}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={hideTemporary}
              className="block w-full rounded-xl border-2 border-[var(--color-border)] bg-white py-3 text-[14px] font-bold text-[var(--color-text)]"
            >
              👁 잠시 숨기기
            </button>
            <p className="mt-2 text-center text-[11px] leading-snug text-[var(--color-muted)]">
              완전히 끄지는 않아요. 작은 점이 남아 있어 다시 누르시면 보입니다.
              <br />
              새로고침하셔도 다시 나타납니다.
            </p>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {msgs.map((m, i) => {
              const isAssistant = m.role === "assistant";
              const parsed = isAssistant && m.content ? parseMessage(m.content) : null;
              const stages = m.stages ?? [];
              const hasStages = isAssistant && stages.length > 0;
              const isWorking = hasStages && stages.some((s) => s.state === "running");
              return (
                <div key={i} className="flex flex-col gap-2">
                  {/* 에이전트 작업 단계 (사용자에게 진행 상황 시각화) */}
                  {hasStages && (
                    <div
                      className={`max-w-[90%] rounded-xl border ${
                        isWorking
                          ? "border-[var(--color-primary)]/30 bg-[var(--bg-soft-blue)]"
                          : "border-[var(--color-border)] bg-[var(--bg-page)]"
                      } p-3`}
                    >
                      <p
                        className={`mb-1.5 text-[11px] font-bold ${
                          isWorking ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                        }`}
                      >
                        🤖 에이전트 {isWorking ? "작업 중" : "완료"}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {stages.map((s, si) => (
                          <li
                            key={si}
                            className="flex items-center gap-2 text-[12px] leading-snug"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center text-[11px] ${
                                s.state === "running"
                                  ? "animate-pulse text-[var(--color-primary)]"
                                  : "text-[var(--color-success)]"
                              }`}
                              aria-hidden
                            >
                              {s.state === "running" ? "●" : "✓"}
                            </span>
                            <span
                              className={
                                s.state === "running"
                                  ? "font-semibold text-[var(--color-text)]"
                                  : "text-[var(--color-muted)]"
                              }
                            >
                              {s.icon} {s.label}
                              {s.summary && (
                                <span className="ml-1 text-[var(--color-success)]">
                                  · {s.summary}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-[var(--color-primary)] text-white"
                        : "bg-[var(--bg-page)] text-[var(--color-text)]"
                    }`}
                  >
                    {m.content ? (
                      parsed ? parsed.body : m.content
                    ) : !hasStages ? (
                      <span className="inline-flex gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)] [animation-delay:0.2s]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)] [animation-delay:0.4s]" />
                      </span>
                    ) : null}
                  </div>
                  {/* 액션 카드 — 챗봇이 응답에 [[/path|label]] 마크업 포함 시 클릭 가능 카드로 변환 */}
                  {parsed && parsed.actions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {parsed.actions.map((a, ai) => (
                        <Link
                          key={ai}
                          href={a.href}
                          onClick={handleClose}
                          className="flex items-center gap-2 rounded-xl border-2 border-[var(--color-primary)]/30 bg-white px-4 py-3 text-[14px] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                        >
                          <span className="flex-1 text-left leading-snug">
                            {a.label}
                          </span>
                          <span aria-hidden>→</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 빠른 이동 칩 — 첫 진입 시만 (현재 페이지에 따라 다른 4곳으로) */}
            {showQuickPrompts && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="px-1 text-[12px] font-medium text-[var(--color-muted)]">
                  바로 가볼 만한 곳
                </p>
                {prompts.map((p, i) => (
                  <Link
                    key={i}
                    href={p.href}
                    onClick={handleClose}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left text-[14px] text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--bg-soft-blue)]"
                  >
                    <span className="text-xl" aria-hidden>
                      {p.icon}
                    </span>
                    <span className="flex-1 leading-snug">{p.text}</span>
                    <span className="text-[var(--color-muted)]" aria-hidden>
                      →
                    </span>
                  </Link>
                ))}
                <p className="mt-1 px-1 text-[11px] leading-relaxed text-[var(--color-muted)]">
                  💬 자세한 답변이 필요하시면 아래에 직접 물어보시거나 마이크 버튼을 눌러주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 챗봇 대화 컨트롤 — 이전 메시지 / 처음부터 (모달 내부 상태만 조작, 페이지 이동 X) */}
        <div className="flex gap-2 border-t border-[var(--color-border)] bg-[var(--bg-page)] px-3 py-2">
          <button
            type="button"
            onClick={goBackInChat}
            disabled={msgs.length <= 1 || streaming}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-soft-blue)] disabled:opacity-40 disabled:hover:bg-white"
          >
            ← 이전 메시지
          </button>
          <button
            type="button"
            onClick={resetChat}
            disabled={msgs.length <= 1 && !streaming}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-soft-blue)] disabled:opacity-40 disabled:hover:bg-white"
          >
            🔄 처음부터
          </button>
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
