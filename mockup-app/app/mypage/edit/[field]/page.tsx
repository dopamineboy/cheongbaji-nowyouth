// 마이페이지 — 항목별 개별 수정 (동적 라우트)
// /mypage/edit/birth, /mypage/edit/household, /mypage/edit/income, ...
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/current-user";
import { isOnboarded } from "../../../lib/auth";
import FieldEditor from "./field-editor";

export const dynamic = "force-dynamic";

const FIELD_META: Record<string, { title: string; hint: string }> = {
  name:            { title: "이름",         hint: "다른 이용자에게는 마스킹된 이름이 보여요." },
  birth:           { title: "출생 연도·월", hint: "정확한 만 나이로 혜택을 추천드리기 위해 필요해요." },
  region:          { title: "시·도",        hint: "이사하셨다면 새 거주지로 바꿔주세요." },
  district:        { title: "시·군·구",     hint: "정확한 동까지 알려주시면 매칭이 더 정확해져요." },
  household:       { title: "가구 형태·인원", hint: "가구원 수가 늘거나 줄었을 때 바꿔주세요." },
  income:          { title: "월 소득",       hint: "가구 전체의 한 달 소득(원)을 알려주세요." },
  welfare:         { title: "복지 상태",    hint: "기초생활수급·차상위 여부에 따라 추천이 달라져요." },
  housing:         { title: "주거 형태",    hint: "자가·전세·월세에 따라 받으실 수 있는 혜택이 달라요." },
  disability:      { title: "장애 등록",    hint: "등록 장애인이시면 추가 혜택이 있어요." },
  veteran:         { title: "국가유공자",   hint: "국가유공자(보훈대상자)는 TV 수신료 면제 등 별도 혜택이 있어요." },
  youngChild:      { title: "영유아 가구원", hint: "가구원 중 만 6세 이하 자녀·손주가 있나요?" },
  jobTypes:        { title: "선호 활동 유형", hint: "원하시는 활동을 모두 골라주세요. 여러 개 선택할 수 있어요." },
  pastOccupations: { title: "이전 직종",     hint: "전에 하셨던 일을 쉼표(,)로 구분해 적어주세요." },
  timeSlots:       { title: "선호 시간대",   hint: "일하실 수 있는 시간대를 모두 골라주세요." },
  hourlyWage:      { title: "희망 시급",     hint: "원하시는 시급(원)을 입력해주세요. 비워두시면 무관으로 처리돼요." },
  outdoor:         { title: "야외 활동",     hint: "야외에서 일하실 수 있나요?" },
  walkingHeavy:    { title: "도보 많은 일",  hint: "오래 걷거나 서 있는 일을 하실 수 있나요?" },
  driving:         { title: "운전 가능",     hint: "업무용 운전이 가능하신가요?" },
};

export default async function FieldEditPage({
  params,
}: {
  params: Promise<{ field: string }>;
}) {
  if (!(await isOnboarded())) redirect("/welcome");
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");

  const { field } = await params;
  const meta = FIELD_META[field];
  if (!meta) redirect("/mypage");

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col gap-4 bg-[var(--bg-page)] px-5 pt-6 pb-12">
      <header>
        <Link
          href="/mypage"
          className="text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 마이페이지
        </Link>
        <h1 className="mt-2 text-[24px] font-extrabold text-[var(--color-text)]">
          {meta.title}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">{meta.hint}</p>
      </header>
      <FieldEditor field={field} user={user} />
    </main>
  );
}
