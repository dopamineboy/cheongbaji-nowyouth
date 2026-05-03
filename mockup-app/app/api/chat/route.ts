// AI 챗봇 — Function Calling 기반 에이전트
// - 4개 검색 도구: searchJobs · searchBenefits · getOutingByPreference · getTrainingByCareer
// - 1개 행동 도구: estimateMonthlyTotal (사용자 매칭된 모든 혜택+일자리 합산)
// - 단계별 진행 상황을 SSE event로 전달 → 클라이언트가 에이전트 흐름 시각화
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "../../lib/current-user";
import { loadAllBenefits } from "../../lib/welfare/content";
import { matchBenefits, totalEligibleAmount } from "../../lib/welfare/matcher";
import { toWelfareProfile } from "../../lib/welfare/adapter";
import { matchJobsForUser } from "../../lib/jobs/match";
import { ensureJobsLoaded } from "../../lib/jobs/ingestion/pipeline";
import { getStore } from "../../lib/store";
import { recommendOutings, OUTINGS } from "../../lib/outings/data";
import { recommendedTrainings } from "../../lib/training/match";
import type { UserProfile } from "../../lib/types";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `당신은 청바지(NowYouth) — 65세 이상 시니어를 위한 통합 라이프스타일 플랫폼의 친절한 도우미 에이전트입니다.

응답 원칙:
- 반드시 **존댓말**, 따뜻하고 부드러운 어조
- 문장은 짧고 명료하게 (시니어가 읽기 좋게)
- 어려운 단어는 풀어 설명
- 모르는 것은 솔직하게 말하고, 주민센터·복지로 등 신뢰할 출처로 안내
- 응답은 3~5문장 이내, 너무 길지 않게

[중요] 사용자 질문이 데이터 조회·매칭이 필요하면 **반드시 도구를 호출**하세요:
- searchJobs: 일자리 키워드·조건 검색
- searchBenefits: 복지 혜택 카테고리·금액별 검색
- getOutingByPreference: 0원 나들이 코스 (날씨·체력별)
- getTrainingByCareer: 경력 기반 무료 교육 추천
- estimateMonthlyTotal: 사용자 매칭된 모든 혜택+일자리 월 합계 추정

도구 호출 후 결과를 자연스러운 한국어로 정리해 답변합니다.

[중요] 답변 끝에 1~3개 액션 카드를 다음 형식으로 포함:
[[/welfare|복지 알리미 보기]]
[[/jobs|일자리 매칭 보기]]
[[/training|무료 연계 교육 보기]]
[[/activity/outings|0원 나들이 보기]]
[[/activity/culture|문화누리카드 추천 활동]]
[[/activity/transport-card|교통카드 발급 안내]]
[[/community|우리 동 커뮤니티]]
[[/welfare/{id}|특정 혜택 상세]]  (id 예: basic-pension, energy-voucher 등)
형식: [[경로|버튼 표시 한국어]]`;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  currentPath?: string;
}

const PAGE_LABEL: Record<string, string> = {
  "/": "홈",
  "/welcome": "환영 페이지",
  "/onboarding": "인터뷰",
  "/welfare": "복지 알리미",
  "/jobs": "일자리 매칭",
  "/training": "무료 연계 교육",
  "/activity": "활동 리워드",
  "/activity/outings": "0원 나들이",
  "/activity/culture": "문화누리카드 추천 활동",
  "/activity/transport-card": "경로우대 교통카드 발급 안내",
  "/community": "우리 동 커뮤니티",
  "/rewards": "포인트 교환",
};

function describePath(path?: string): string {
  if (!path) return "";
  const exact = PAGE_LABEL[path];
  if (exact) return exact;
  if (path.startsWith("/welfare/")) return "복지 혜택 상세";
  if (path.startsWith("/jobs/")) return "일자리 상세";
  if (path.startsWith("/activity/outings/")) return "0원 나들이 코스 상세";
  if (path.startsWith("/community/")) return "커뮤니티 글";
  return path;
}

// ─────────────────────────────────────
// 도구 정의 (OpenAI tools schema)
// ─────────────────────────────────────
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchJobs",
      description:
        "사용자에게 추천 가능한 일자리를 검색합니다. 거리·시급·시간대 조건으로 필터링.",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "일자리 키워드 (예: 경비, 보육, 교육)" },
          radiusKm: { type: "number", description: "최대 통근 거리 km (기본 30)" },
          wageMin: { type: "number", description: "최소 시급 (원)" },
          limit: { type: "number", description: "결과 개수 (기본 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchBenefits",
      description: "사용자가 받을 수 있는 복지 혜택을 카테고리·금액별로 검색합니다.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "카테고리 (예: 노후소득보장, 주거·에너지, 건강·돌봄, 문화여가, 통신비)",
          },
          minAmount: { type: "number", description: "최소 지원 금액 (원/월)" },
          eligibleOnly: { type: "boolean", description: "바로 신청 가능한 것만" },
          limit: { type: "number", description: "결과 개수 (기본 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOutingByPreference",
      description: "0원 나들이 코스를 사용자 선호(날씨·체력·노선)에 맞춰 추천합니다.",
      parameters: {
        type: "object",
        properties: {
          weather: {
            type: "string",
            enum: ["indoor", "outdoor", "any"],
            description: "비 오는 날이면 indoor, 야외 산책이면 outdoor",
          },
          stamina: {
            type: "string",
            enum: ["easy", "mid", "heavy"],
            description: "체력 (쉬움/보통/많이)",
          },
          line: { type: "string", description: "지하철 노선 (예: 3호선, 4호선)" },
          limit: { type: "number", description: "결과 개수 (기본 3)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTrainingByCareer",
      description: "사용자 경력에 맞는 정부 지원 교육 과정을 추천합니다.",
      parameters: {
        type: "object",
        properties: {
          occupation: { type: "string", description: "관심·경력 분야 (예: 보육, 돌봄, 디지털)" },
          freeOnly: { type: "boolean", description: "본인부담 0원만" },
          limit: { type: "number", description: "결과 개수 (기본 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimateMonthlyTotal",
      description:
        "사용자가 받을 수 있는 모든 매칭된 복지 혜택과 추천 일자리의 월 예상 합계를 계산합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ─────────────────────────────────────
// 도구 핸들러
// ─────────────────────────────────────
type ToolHandler = (
  args: Record<string, unknown>,
  user: UserProfile,
) => Promise<unknown>;

const TOOL_LABEL: Record<string, string> = {
  searchJobs: "일자리 검색",
  searchBenefits: "복지 매칭 분석",
  getOutingByPreference: "0원 나들이 추천",
  getTrainingByCareer: "교육 과정 검색",
  estimateMonthlyTotal: "월 예상 합계 계산",
};

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  async searchJobs(args, user) {
    await ensureJobsLoaded();
    const keyword = (args.keyword as string | undefined)?.toLowerCase();
    const radiusKm = (args.radiusKm as number | undefined) ?? 30;
    const wageMin = (args.wageMin as number | undefined) ?? 0;
    const limit = (args.limit as number | undefined) ?? 5;
    let jobs = matchJobsForUser(user, getStore().jobs);
    if (keyword) {
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(keyword) ||
          j.org.toLowerCase().includes(keyword) ||
          j.activityType.toLowerCase().includes(keyword),
      );
    }
    jobs = jobs.filter((j) => j.distanceKm <= radiusKm && j.wageKrwPerHour >= wageMin);
    return {
      count: jobs.length,
      results: jobs.slice(0, limit).map((j) => ({
        id: j.id,
        title: j.title,
        org: j.org,
        wage: j.wageKrwPerHour,
        distanceKm: Math.round(j.distanceKm * 10) / 10,
        score: j.score,
        activityType: j.activityType,
      })),
    };
  },

  async searchBenefits(args, user) {
    const benefits = loadAllBenefits();
    const matched = matchBenefits(toWelfareProfile(user), benefits);
    let pool = matched.filter((m) => m.status === "eligible" || m.status === "likely_eligible");
    const category = args.category as string | undefined;
    if (category) {
      pool = pool.filter((m) => m.benefit.category.includes(category));
    }
    const minAmount = (args.minAmount as number | undefined) ?? 0;
    if (minAmount > 0) {
      pool = pool.filter((m) => {
        const amt = m.benefit.benefit.amount_krw_max?.single ?? 0;
        return amt >= minAmount;
      });
    }
    if (args.eligibleOnly) {
      pool = pool.filter((m) => m.status === "eligible");
    }
    const limit = (args.limit as number | undefined) ?? 5;
    return {
      count: pool.length,
      results: pool.slice(0, limit).map((m) => ({
        id: m.benefit.id,
        name: m.benefit.name,
        category: m.benefit.category,
        status: m.status === "eligible" ? "바로 신청 가능" : "주민센터 확인 후",
        amountKrw:
          m.benefit.benefit.amount_krw_max?.single ??
          m.benefit.benefit.amount_krw_max?.couple ??
          0,
        type: m.benefit.benefit.type,
      })),
    };
  },

  async getOutingByPreference(args) {
    let pool = [...OUTINGS];
    const weather = args.weather as string | undefined;
    if (weather === "indoor") {
      pool = pool.filter((o) => o.weatherFit === "indoor" || o.weatherFit === "any");
    } else if (weather === "outdoor") {
      pool = pool.filter((o) => o.weatherFit === "outdoor" || o.weatherFit === "any");
    }
    const stamina = args.stamina as string | undefined;
    if (stamina) pool = pool.filter((o) => o.stamina === stamina);
    const line = args.line as string | undefined;
    if (line) pool = pool.filter((o) => o.line === line);
    const limit = (args.limit as number | undefined) ?? 3;
    return {
      count: pool.length,
      results: pool.slice(0, limit).map((o) => ({
        id: o.id,
        title: o.title,
        line: o.line,
        steps: o.totalSteps,
        minutes: o.totalMinutes,
        cost: o.totalCost,
        rewardP: o.totalRewardPoints,
        stamina: o.stamina,
      })),
    };
  },

  async getTrainingByCareer(args, user) {
    const occupation = args.occupation as string | undefined;
    const list = recommendedTrainings(
      user.jobPreferences?.preferredJobTypes ?? [],
      occupation
        ? [occupation, ...(user.jobPreferences?.pastOccupations ?? [])]
        : (user.jobPreferences?.pastOccupations ?? []),
      (args.limit as number | undefined) ?? 5,
    );
    let pool = list;
    if (args.freeOnly) pool = pool.filter((t) => t.feeKrw === 0);
    return {
      count: pool.length,
      results: pool.map((t) => ({
        id: t.id,
        name: t.name,
        agency: t.agency,
        feeKrw: t.feeKrw,
        duration: t.duration,
        category: t.category,
      })),
    };
  },

  async estimateMonthlyTotal(_, user) {
    const benefits = loadAllBenefits();
    const matched = matchBenefits(toWelfareProfile(user), benefits);
    const welfareMonthly = totalEligibleAmount(matched);
    await ensureJobsLoaded();
    const jobs = matchJobsForUser(user, getStore().jobs).slice(0, 1);
    const jobMonthly = jobs[0]
      ? Math.round((jobs[0].wageKrwPerHour * jobs[0].hoursPerWeek * 4) / 1000) * 1000
      : 0;
    return {
      welfareMonthlyKrw: welfareMonthly,
      jobMonthlyKrw: jobMonthly,
      totalMonthlyKrw: welfareMonthly + jobMonthly,
      breakdown: {
        welfareCount: matched.filter(
          (m) => m.status === "eligible" || m.status === "likely_eligible",
        ).length,
        topJob: jobs[0]?.title ?? null,
      },
    };
  },
};

// ─────────────────────────────────────
// SSE 이벤트 전송 헬퍼
// ─────────────────────────────────────
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: "BAD_JSON", message: "요청 형식 오류" } },
      { status: 400 },
    );
  }

  if (!body.messages?.length) {
    return Response.json(
      { ok: false, error: { code: "EMPTY", message: "메시지가 비어있어요" } },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();

  // 폴백 — 키 없거나 사용자 없을 때
  if (!process.env.OPENAI_API_KEY || !user) {
    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
    const txt = `[데모 모드] 질문하신 내용: "${lastUser?.content ?? ""}"\n\n복지·일자리·교육·활동·커뮤니티에 대해 자세한 정보는 각 탭에서 확인하실 수 있어요.\n\n[[/welfare|복지 알리미 보기]]\n[[/jobs|일자리 매칭 보기]]\n[[/activity/outings|0원 나들이 보기]]`;
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(encoder.encode(sse("answer", { content: txt })));
          c.enqueue(encoder.encode(sse("done", {})));
          c.close();
        },
      }),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } },
    );
  }

  // 사용자 컨텍스트 (system prompt에 압축 주입)
  let userContext = `\n[사용자 정보]\n- 이름: ${user.name}\n- 나이: 만 ${new Date().getFullYear() - user.birthYear}세\n- 거주: ${user.region} ${user.district} (${user.dongName})\n- 가구: ${user.householdSize}인\n- 한 달 가구 합산 소득: ${user.monthlyIncomeKrw ? `약 ${user.monthlyIncomeKrw.toLocaleString()}원` : "미입력"}`;
  if (body.currentPath) {
    userContext += `\n- 지금 보고 있는 페이지: ${describePath(body.currentPath)} (${body.currentPath})`;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const enq = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));
      try {
        enq("status", { stage: "thinking", label: "질문을 분석하고 있어요" });

        // 1차 호출 — 도구 결정
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: SYSTEM_PROMPT + userContext },
          ...body.messages,
        ];
        const first = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 600,
          tools: TOOLS,
          tool_choice: "auto",
          messages,
        });
        const choice = first.choices[0];
        const toolCalls = choice.message.tool_calls;

        // 도구 호출 있음 → 실행 후 2차 LLM 호출
        if (toolCalls && toolCalls.length > 0) {
          messages.push(choice.message);

          for (const tc of toolCalls) {
            // OpenAI SDK v6+에서는 tc.type이 'function'|'custom' 등으로 분기
            // function 타입만 처리
            if (tc.type !== "function") continue;
            const name = tc.function.name;
            const label = TOOL_LABEL[name] ?? name;
            enq("status", { stage: "tool_call", label, name });
            let result: unknown;
            try {
              const args = JSON.parse(tc.function.arguments || "{}");
              const handler = TOOL_HANDLERS[name];
              result = handler ? await handler(args, user) : { error: "unknown tool" };
            } catch (e) {
              result = { error: e instanceof Error ? e.message : "tool 실행 오류" };
            }
            // tool_result 이벤트 — 클라이언트가 "✓ N건 찾았어요" 표시
            const summary =
              typeof result === "object" && result !== null && "count" in result
                ? `${(result as { count: number }).count}건 찾았어요`
                : "결과 받았어요";
            enq("status", { stage: "tool_result", label, name, summary });
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }

          enq("status", { stage: "answering", label: "답변을 정리하고 있어요" });

          // 2차 호출 — 최종 답변 (스트리밍)
          const final = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.4,
            max_tokens: 700,
            stream: true,
            messages,
          });
          let acc = "";
          for await (const chunk of final) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              acc += delta;
              enq("answer_delta", { delta });
            }
          }
          enq("answer", { content: acc });
        } else {
          // 도구 호출 없음 — 바로 답변
          enq("status", { stage: "answering", label: "답변을 정리하고 있어요" });
          const text = choice.message.content ?? "";
          enq("answer", { content: text });
        }

        enq("done", {});
        controller.close();
      } catch (e) {
        enq("error", { message: e instanceof Error ? e.message : "알 수 없는 오류" });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
