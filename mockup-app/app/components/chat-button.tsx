"use client";

// AI 챗봇 플로팅 버튼 (S1 stub)
// 키워드 매칭 기반 FAQ 응답. S2에서 OpenAI Streaming으로 교체.
import { useState } from "react";

interface QA {
  keywords: string[];
  answer: string;
}

const FAQ: QA[] = [
  {
    keywords: ["기초연금", "노령연금"],
    answer:
      "기초연금은 만 65세 이상이고 가구 월 소득이 213만원 이하면 받으실 수 있어요. 매달 통장으로 최대 34만원 입금돼요. 주민센터에서 신청하시거나 복지로 사이트에서도 가능해요.",
  },
  {
    keywords: ["에너지", "난방비", "가스", "전기료"],
    answer:
      "에너지바우처는 겨울철 난방비 부담을 덜어드려요. 기초생활보장 또는 차상위 어르신께 1년에 약 19만원까지 지원해요. 신청은 11월 전에 주민센터에서 하시면 좋아요.",
  },
  {
    keywords: ["문화누리", "공연", "여행"],
    answer:
      "문화누리카드는 1년에 14만원의 문화·여행·체육 바우처예요. 기초생활수급자나 차상위 어르신은 신분증만으로 주민센터에서 발급받으실 수 있어요.",
  },
  {
    keywords: ["일자리", "구직", "일", "취업"],
    answer:
      "공공 노인일자리에는 공익활동형(환경·안전), 사회서비스형(돌봄·교육), 시장형(공방·매장) 세 가지가 있어요. 청바지 일자리 탭에서 거주지 근처로 자동 매칭해드려요.",
  },
  {
    keywords: ["품앗이", "도움", "이웃"],
    answer:
      "품앗이는 같은 동 이웃과 서로 도와주는 기능이에요. 병원 동행, 스마트폰 가르치기, 산책 친구 등 작은 도움을 주고받으면 양쪽에 100포인트가 적립돼요.",
  },
  {
    keywords: ["포인트", "교환", "리워드"],
    answer:
      "포인트는 인지게임·학습퀴즈·복지신청·일자리·품앗이 활동으로 쌓을 수 있어요. 1,000P부터 편의점 상품권으로 교환하실 수 있어요.",
  },
  {
    keywords: ["치매", "검진", "기억력"],
    answer:
      "관할 보건소 치매안심센터에서 무료로 인지기능 검사를 받으실 수 있어요. 검사 후 인지 훈련 프로그램에도 연결해드려요.",
  },
];

const FALLBACK =
  "복지·일자리·품앗이·포인트에 대해 궁금한 걸 한국어로 적어주시면 답변드릴게요. 예: '기초연금 어떻게 받아요?', '오늘 받을 수 있는 혜택 알려줘'";

function answer(q: string): string {
  const t = q.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((k) => t.includes(k))) return item.answer;
  }
  return FALLBACK;
}

interface Msg {
  role: "user" | "bot";
  text: string;
}

async function resetOnboarding() {
  if (!confirm("인터뷰를 다시 진행하시겠어요? 현재 입력 정보는 초기화돼요.")) return;
  await fetch("/api/onboarding/complete", { method: "DELETE" });
  window.location.href = "/welcome";
}

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "안녕하세요, 청바지 도우미예요. 복지·일자리·품앗이·포인트에 대해 무엇이든 물어보세요.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const a = answer(q);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: a }]);
    setInput("");
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[var(--color-primary)] text-white"
                    : "bg-[var(--bg-page)] text-[var(--color-text)]"
                }`}
              >
                {m.text}
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
              className="flex-1 rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[15px]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-[var(--color-primary)] px-5 text-[15px] font-bold text-white disabled:opacity-40"
            >
              보내기
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            S1 단계: 자주 묻는 질문 응답 · S2부터 OpenAI 실시간 답변
          </p>
          <button
            type="button"
            onClick={resetOnboarding}
            className="mt-1 block w-full text-center text-[11px] text-[var(--color-muted)] underline"
          >
            인터뷰 다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}
