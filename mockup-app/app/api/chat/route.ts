// AI 챗봇 — OpenAI 스트리밍 + 사용자 컨텍스트 주입.
// OPENAI_API_KEY 없으면 FAQ 키워드 매칭으로 폴백.
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "../../lib/current-user";
import { loadAllBenefits } from "../../lib/welfare/content";
import { matchBenefits } from "../../lib/welfare/matcher";
import { toWelfareProfile } from "../../lib/welfare/adapter";

export const dynamic = "force-dynamic";

const FAQ_FALLBACK = `OPENAI_API_KEY가 설정되지 않아 자주 묻는 질문 응답을 사용 중입니다. 운영 시점에 키만 추가하면 자연스러운 답변으로 전환돼요.`;

const SYSTEM_PROMPT = `당신은 청바지(NowYouth) — 65세 이상 시니어를 위한 통합 라이프스타일 플랫폼의 친절한 도우미입니다.

응답 원칙:
- 반드시 **존댓말**, 따뜻하고 부드러운 어조
- 문장은 짧고 명료하게 (시니어가 읽기 좋게)
- 어려운 단어는 풀어 설명 ('소득인정액' → '집안 전체 한 달 소득')
- 모르는 것은 모른다고 솔직하게 말하고, 주민센터·복지로 등 신뢰할 출처로 안내
- 4대 기능: 복지 알리미 · 일자리 매칭 · 우리 동 품앗이 · 활동 리워드
- 사용자 프로필 컨텍스트가 있으면 활용해서 개인화된 답변
- 응답은 3~5문장 이내, 너무 길지 않게
- 의료·법률·금융 조언은 전문가 상담 안내로 대체`;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
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

  // 사용자 컨텍스트 + 매칭된 혜택 일부 주입 (LLM이 정확한 답변 가능하도록)
  const user = await getCurrentUser();
  let userContext = "";
  if (user) {
    userContext = `
[사용자 정보]
- 이름: ${user.name}
- 나이: 만 ${new Date().getFullYear() - user.birthYear}세
- 거주: ${user.region} ${user.district}
- 가구: ${user.householdSize}인
- 한 달 가구 합산 소득: ${user.monthlyIncomeKrw ? `약 ${user.monthlyIncomeKrw.toLocaleString()}원` : "미입력"}

[자동 매칭된 혜택 (상위 5개)]`;

    const benefits = loadAllBenefits();
    const matched = matchBenefits(toWelfareProfile(user), benefits);
    const top = matched
      .filter((m) => m.status === "eligible" || m.status === "likely_eligible")
      .slice(0, 5);
    for (const m of top) {
      const amount =
        m.benefit.benefit.amount_krw_max?.single ??
        m.benefit.benefit.amount_krw_max?.couple ??
        0;
      userContext += `\n- ${m.benefit.name} (${m.benefit.benefit.type === "monthly_cash" ? "매달" : "1회"} 최대 ${amount.toLocaleString()}원)`;
    }
  }

  // OpenAI 키 없으면 FAQ 폴백
  if (!process.env.OPENAI_API_KEY) {
    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
    const fallbackText = `[데모 모드] ${FAQ_FALLBACK}\n\n질문하신 내용: "${lastUser?.content ?? ""}"\n\n복지·일자리·품앗이·포인트에 대해 자세한 정보는 각 탭에서 확인하실 수 있어요.`;
    return new Response(fallbackText, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n" + userContext },
        ...body.messages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (e) {
          controller.enqueue(
            encoder.encode(`\n[오류] ${e instanceof Error ? e.message : "알 수 없는 오류"}`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "OPENAI_ERROR",
          message: e instanceof Error ? e.message : "OpenAI 호출 실패",
        },
      },
      { status: 500 },
    );
  }
}
