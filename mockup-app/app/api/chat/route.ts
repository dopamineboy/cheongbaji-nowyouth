// AI 챗봇 — OpenAI 스트리밍 + 4대 기능 통합 컨텍스트 + 액션 카드 마크업
// OPENAI_API_KEY 없으면 FAQ 키워드 매칭으로 폴백.
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "../../lib/current-user";
import { loadAllBenefits } from "../../lib/welfare/content";
import { matchBenefits } from "../../lib/welfare/matcher";
import { toWelfareProfile } from "../../lib/welfare/adapter";
import { matchJobsForUser } from "../../lib/jobs/match";
import { ensureJobsLoaded } from "../../lib/jobs/ingestion/pipeline";
import { getStore } from "../../lib/store";
import { recommendOutings } from "../../lib/outings/data";
import { recommendedTrainings } from "../../lib/training/match";

export const dynamic = "force-dynamic";

const FAQ_FALLBACK = `OPENAI_API_KEY가 설정되지 않아 자주 묻는 질문 응답을 사용 중입니다. 운영 시점에 키만 추가하면 자연스러운 답변으로 전환돼요.`;

const SYSTEM_PROMPT = `당신은 청바지(NowYouth) — 65세 이상 시니어를 위한 통합 라이프스타일 플랫폼의 친절한 도우미입니다.

응답 원칙:
- 반드시 **존댓말**, 따뜻하고 부드러운 어조
- 문장은 짧고 명료하게 (시니어가 읽기 좋게)
- 어려운 단어는 풀어 설명 ('소득인정액' → '집안 전체 한 달 소득')
- 모르는 것은 모른다고 솔직하게 말하고, 주민센터·복지로 등 신뢰할 출처로 안내
- 4대 기능 + 추가 영역: 복지 알리미 · 일자리 매칭 · 무료 연계 교육 · 활동 리워드 · 0원 나들이 · 우리 동 커뮤니티
- 사용자 프로필 + 자동 매칭 결과 컨텍스트를 적극 활용해 개인화된 답변
- 응답은 3~5문장 이내, 너무 길지 않게
- 의료·법률·금융 조언은 전문가 상담 안내로 대체

[중요] 액션 카드 — 사용자가 즉시 이동할 수 있는 페이지가 있으면 답변 끝에 다음 형식으로 1~3개까지 포함하세요:
[[/welfare/basic-pension|기초연금 신청 가이드 보기]]
[[/jobs|우리 동 추천 일자리 보기]]
[[/training|무료 연계 교육 보기]]
[[/activity/outings|오늘의 0원 나들이 추천 보기]]
[[/activity/culture|문화누리카드 추천 활동]]
[[/activity/transport-card|경로우대 교통카드 발급 안내]]
[[/community|우리 동 커뮤니티]]
형식: [[경로|버튼에 표시될 한국어 문구]]
- 경로는 반드시 위 목록의 실제 경로만 사용 (없는 경로는 만들지 말 것)
- 사용자가 본문 본 직후 바로 행동할 수 있게, 답변 본문에서 언급한 페이지를 액션 카드로 마무리`;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  currentPath?: string; // 사용자가 챗봇 열 때의 페이지 경로
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
  // /welfare/[id], /jobs/[id], /activity/outings/[id] 같은 동적 경로
  if (path.startsWith("/welfare/")) return "복지 혜택 상세";
  if (path.startsWith("/jobs/")) return "일자리 상세";
  if (path.startsWith("/activity/outings/")) return "0원 나들이 코스 상세";
  if (path.startsWith("/community/")) return "커뮤니티 글";
  return path;
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

  // 통합 사용자 컨텍스트 — 4대 기능 + 0원 나들이/교육까지
  const user = await getCurrentUser();
  let userContext = "";

  if (user) {
    userContext = `
[사용자 정보]
- 이름: ${user.name}
- 나이: 만 ${new Date().getFullYear() - user.birthYear}세
- 거주: ${user.region} ${user.district} (${user.dongName})
- 가구: ${user.householdSize}인
- 한 달 가구 합산 소득: ${user.monthlyIncomeKrw ? `약 ${user.monthlyIncomeKrw.toLocaleString()}원` : "미입력"}`;

    if (body.currentPath) {
      userContext += `\n- 지금 보고 있는 페이지: ${describePath(body.currentPath)} (${body.currentPath})`;
    }

    // 1. 복지 매칭 top 5
    const benefits = loadAllBenefits();
    const matched = matchBenefits(toWelfareProfile(user), benefits);
    const topWelfare = matched
      .filter((m) => m.status === "eligible" || m.status === "likely_eligible")
      .slice(0, 5);
    if (topWelfare.length > 0) {
      userContext += `\n\n[자동 매칭된 복지 혜택 ${topWelfare.length}건]`;
      for (const m of topWelfare) {
        const amount =
          m.benefit.benefit.amount_krw_max?.single ??
          m.benefit.benefit.amount_krw_max?.couple ??
          0;
        const status = m.status === "eligible" ? "바로 신청 가능" : "주민센터 확인 후";
        userContext += `\n- ${m.benefit.name} [${status}] ${m.benefit.benefit.type === "monthly_cash" ? "매달" : "1회"} 최대 ${amount.toLocaleString()}원 (id: ${m.benefit.id})`;
      }
    }

    // 2. 일자리 매칭 top 3
    try {
      await ensureJobsLoaded();
      const jobs = matchJobsForUser(user, getStore().jobs).slice(0, 3);
      if (jobs.length > 0) {
        userContext += `\n\n[추천 일자리 ${jobs.length}건]`;
        for (const j of jobs) {
          const wage = j.wageKrwPerHour.toLocaleString();
          const dist = j.distanceKm < 1 ? `${(j.distanceKm * 1000).toFixed(0)}m` : `${j.distanceKm.toFixed(1)}km`;
          userContext += `\n- ${j.title} (${j.org}) · 시급 ${wage}원 · ${dist} · 적합도 ${j.score}점 (id: ${j.id})`;
        }
      }
    } catch {
      // ignore — jobs load 실패 시 컨텍스트 생략
    }

    // 3. 추천 0원 나들이 1
    const outings = recommendOutings({
      region: user.region,
      walkingHeavyOk: user.jobPreferences?.walkingHeavyOk,
    });
    if (outings.length > 0) {
      const o = outings[0];
      userContext += `\n\n[추천 0원 나들이]\n- ${o.title} (${o.line}) · ${Math.floor(o.totalMinutes / 60)}시간 · 0원 · 완료 시 +${o.totalRewardPoints}P`;
    }

    // 4. 추천 교육 1
    const trainings = recommendedTrainings(
      user.jobPreferences?.preferredJobTypes ?? [],
      user.jobPreferences?.pastOccupations ?? [],
      1,
    );
    if (trainings.length > 0) {
      const t = trainings[0];
      userContext += `\n\n[추천 무료 연계 교육]\n- ${t.name} (${t.agency}) · 본인부담 ${t.feeKrw === 0 ? "0원" : t.feeKrw.toLocaleString() + "원"}`;
    }

    // 5. 활동 — 이번 주 적립 가능 한도 (정적)
    userContext += `\n\n[이번 주 활동 적립 가능 한도] 최대 590P (인지 게임/학습 퀴즈/한글 미션/걷기/동네 스탬프 미션 합계)`;

    // 6. 우리 동 커뮤니티 — open 글 수
    const myDong = user.dongCode;
    const poomasiCount = getStore().poomasi.filter(
      (p) => p.status === "open" && p.dongCode === myDong && p.reportCount < 3,
    ).length;
    if (poomasiCount > 0) {
      userContext += `\n\n[우리 동 커뮤니티 요청글] ${poomasiCount}건 활성`;
    }
  }

  // OpenAI 키 없으면 FAQ 폴백
  if (!process.env.OPENAI_API_KEY) {
    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
    const fallbackText = `[데모 모드] ${FAQ_FALLBACK}\n\n질문하신 내용: "${lastUser?.content ?? ""}"\n\n복지·일자리·교육·활동·커뮤니티에 대해 자세한 정보는 각 탭에서 확인하실 수 있어요.\n\n[[/welfare|복지 알리미 보기]]\n[[/jobs|일자리 매칭 보기]]\n[[/activity/outings|0원 나들이 보기]]`;
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
      max_tokens: 600,
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
