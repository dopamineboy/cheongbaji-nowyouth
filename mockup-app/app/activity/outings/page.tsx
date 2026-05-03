// 0원 나들이 페이지 — 추천 코스 + 무료 명소 + 노선별 스탬프 투어
// AC §활동 강화: 무료 교통 + 무료 입장 + 활동 포인트 통합
import Link from "next/link";
import { getCurrentUser } from "../../lib/current-user";
import {
  recommendOutings,
  SPOTS,
  isSubwayFree,
  type Spot,
  type Outing,
} from "../../lib/outings/data";

export const dynamic = "force-dynamic";

const STAMINA_LABEL: Record<string, { ko: string; emoji: string }> = {
  easy: { ko: "쉬움", emoji: "🟢" },
  mid: { ko: "보통", emoji: "🟡" },
  heavy: { ko: "많이 걷기", emoji: "🟠" },
};

const WEATHER_LABEL: Record<string, { ko: string; emoji: string }> = {
  indoor: { ko: "실내·비 와도 OK", emoji: "🏠" },
  outdoor: { ko: "야외", emoji: "☀️" },
  any: { ko: "실내·외 혼합", emoji: "🌤" },
};

function OutingCard({ o }: { o: Outing }) {
  const stamina = STAMINA_LABEL[o.stamina];
  const weather = WEATHER_LABEL[o.weatherFit];
  return (
    <Link href={`/activity/outings/${o.id}`}>
      <article className="card-soft card-link relative overflow-hidden rounded-2xl bg-white">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--color-warm)]" />
        <div className="p-5 pl-6">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[var(--color-warm)]/15 px-3 py-1 text-[12px] font-bold text-[var(--color-warm-strong)]">
              🚇 {o.line}
            </span>
            <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-success)]">
              💸 0원
            </span>
            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-primary)]">
              {stamina.emoji} {stamina.ko}
            </span>
          </div>
          <h3 className="text-[18px] font-bold leading-tight text-[var(--color-text)]">
            {o.title}
          </h3>
          <p
            className="mt-1 text-[13px] leading-snug text-[var(--color-muted)]"
            style={{ wordBreak: "keep-all" }}
          >
            {o.description}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
            <div className="rounded-lg bg-[var(--bg-page)] py-2">
              <p className="text-[var(--color-muted)]">예상 보행</p>
              <p className="mt-0.5 font-bold text-[var(--color-text)]">
                {o.totalSteps.toLocaleString()}보
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-page)] py-2">
              <p className="text-[var(--color-muted)]">소요 시간</p>
              <p className="mt-0.5 font-bold text-[var(--color-text)]">
                약 {Math.floor(o.totalMinutes / 60)}시간
                {o.totalMinutes % 60 > 0 && ` ${o.totalMinutes % 60}분`}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-soft-orange)] py-2">
              <p className="text-[var(--color-muted)]">완료 시</p>
              <p className="mt-0.5 font-bold text-[var(--color-warm-strong)]">
                +{o.totalRewardPoints}P
              </p>
            </div>
          </div>
          {o.reasonTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {o.reasonTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--bg-soft-yellow)] px-2 py-0.5 text-[11px] font-semibold text-[#8A5E00]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-warm-strong)]">
            코스 자세히 보고 출발하기 →
          </p>
        </div>
      </article>
    </Link>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-2 py-2.5 text-center text-[13px] font-bold transition ${
        active
          ? "bg-[var(--color-warm)] text-white"
          : "border-2 border-[var(--color-border)] bg-white text-[var(--color-text)]"
      }`}
    >
      {label}
    </Link>
  );
}

function SpotCard({ s }: { s: Spot }) {
  return (
    <article className="card-soft rounded-2xl bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-[var(--color-muted)]">
          {s.imageEmoji} {s.category}
        </span>
        {s.freeEntry && (
          <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-success)]">
            무료 입장
          </span>
        )}
      </div>
      <h3 className="text-[16px] font-bold text-[var(--color-text)]">{s.name}</h3>
      <p className="mt-1 text-[12px] text-[var(--color-muted)]">{s.freeEntryNote}</p>
      <p className="mt-2 text-[13px] text-[var(--color-text)]">
        🚇 {s.nearestStation} · {s.line.join("·")}
      </p>
      <p className="mt-2 text-[12px] font-bold text-[var(--color-warm-strong)]">
        방문 인증 시 +{s.rewardPoints}P
      </p>
    </article>
  );
}

function TabBar() {
  const tabs = [
    { label: "홈", icon: "🏠", href: "/" },
    { label: "복지", icon: "📋", href: "/welfare" },
    { label: "일자리", icon: "💼", href: "/jobs" },
    { label: "활동", icon: "🎯", href: "/activity", active: true },
    { label: "커뮤니티", icon: "💬", href: "/community" },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[448px] -translate-x-1/2 border-t border-[var(--color-border)] bg-white">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-[13px] font-medium ${
                t.active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function OutingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stamina?: string; weather?: string }>;
}) {
  const sp = await searchParams;
  const staminaFilter = sp.stamina as "easy" | "mid" | "heavy" | undefined;
  const weatherFilter = sp.weather as "indoor" | "outdoor" | undefined;
  const user = await getCurrentUser();
  let outings = recommendOutings({
    region: user?.region,
    walkingHeavyOk: user?.jobPreferences?.walkingHeavyOk,
  });
  if (staminaFilter) {
    outings = outings.filter((o) => o.stamina === staminaFilter);
  }
  if (weatherFilter === "indoor") {
    outings = outings.filter(
      (o) => o.weatherFit === "indoor" || o.weatherFit === "any",
    );
  }
  const subwayFree = isSubwayFree(user?.region);

  // 카테고리별 명소 그룹
  const byCategory = new Map<string, Spot[]>();
  for (const s of SPOTS) {
    if (user?.region && !s.region.includes(user.region.replace("특별시", "").replace("광역시", ""))) {
      // MVP: 사용자 지역 이름이 spot region에 포함되는지 단순 매칭
      // 서울 사용자면 서울 명소만
      if (user.region === "서울특별시" && s.region !== "서울특별시") continue;
    }
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/activity"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-warm-strong)]"
        >
          ← 활동으로
        </Link>
        <p className="text-[15px] font-medium text-[var(--color-muted)]">
          청바지 · 청춘은 바로 지금
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          오늘의 <span className="text-[var(--color-warm-strong)]">0원 나들이</span>
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          교통카드만 있으면 0원으로 다녀올 수 있는 곳을 찾아드려요
        </p>
      </header>

      {/* 내 교통 혜택 안내 */}
      <section className="mx-5 mb-5 rounded-2xl border-2 border-[var(--color-warm)]/30 bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold text-[var(--color-text)]">
          🚇 내 교통 혜택
        </h2>
        <ul className="space-y-2 text-[14px] leading-relaxed">
          {subwayFree && (
            <li className="flex gap-2">
              <span className="text-[var(--color-success)]">✓</span>
              <span>
                <span className="font-bold">지하철 무료</span> — 만 65세 이상 도시철도 무임승차 가능
              </span>
            </li>
          )}
          <li className="flex gap-2">
            <span className="text-[var(--color-accent)]">!</span>
            <span>
              <span className="font-bold">버스</span> — 지역별로 무료 / K-패스 환급 / 일반 유료가 달라요
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-primary)]">📌</span>
            <span>
              <span className="font-bold">경로우대 교통카드</span> 필요 — 가까운 주민센터 또는 지정 은행에서 발급 (신분증 지참)
            </span>
          </li>
        </ul>
        <Link
          href="/activity/transport-card"
          className="mt-3 block rounded-xl border-2 border-[var(--color-warm)] bg-white py-3 text-center text-[14px] font-bold text-[var(--color-warm-strong)]"
        >
          교통카드 발급 자세히 보기 →
        </Link>
      </section>

      {/* 체력 필터 + 날씨 필터 (B-2) */}
      <section className="mx-5 mb-3">
        <p className="mb-2 text-[13px] font-bold text-[var(--color-muted)]">
          🦶 내 체력에 맞춰 보기
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <FilterChip
            label="전체"
            href="/activity/outings"
            active={!staminaFilter && !weatherFilter}
          />
          <FilterChip
            label="🟢 쉬움"
            href="/activity/outings?stamina=easy"
            active={staminaFilter === "easy"}
          />
          <FilterChip
            label="🟡 보통"
            href="/activity/outings?stamina=mid"
            active={staminaFilter === "mid"}
          />
          <FilterChip
            label="🟠 많이"
            href="/activity/outings?stamina=heavy"
            active={staminaFilter === "heavy"}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <FilterChip
            label="🏠 비 와도 OK"
            href="/activity/outings?weather=indoor"
            active={weatherFilter === "indoor"}
          />
          <FilterChip
            label="☀️ 야외 산책"
            href="/activity/outings?stamina=mid"
            active={!weatherFilter && staminaFilter === "mid"}
          />
        </div>
      </section>

      {/* 추천 코스 */}
      <section className="mx-5 mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[19px] font-bold text-[var(--color-text)]">
            🌳 추천 코스 ({outings.length}건)
          </h2>
          <span className="text-[12px] text-[var(--color-muted)]">
            {user?.region}{user?.district ? ` ${user.district}` : ""} 기준
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {outings.length > 0 ? (
            outings.map((o) => <OutingCard key={o.id} o={o} />)
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center text-[14px] text-[var(--color-muted)]">
              조건에 맞는 코스가 아직 없어요. <br />
              위에서 다른 필터를 선택해주세요.
            </div>
          )}
        </div>
      </section>

      {/* 카테고리별 무료 명소 */}
      <section className="mx-5 mb-6">
        <h2 className="mb-3 text-[19px] font-bold text-[var(--color-text)]">
          🗺 무료 입장 명소
        </h2>
        {Array.from(byCategory.entries()).map(([cat, spots]) => (
          <div key={cat} className="mb-4">
            <h3 className="mb-2 text-[14px] font-bold text-[var(--color-muted)]">
              {cat} ({spots.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {spots.map((s) => (
                <SpotCard key={s.id} s={s} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 안내 */}
      <p className="mx-5 mb-6 text-[12px] leading-relaxed text-[var(--color-muted)]">
        ※ 입장료 무료 정책은 시설별로 다를 수 있어요. 신분증을 꼭 지참하시고,
        방문 전에 운영 시간을 확인해주세요. 코스 정보는{" "}
        <strong>한국관광공사·서울관광재단</strong> 공개 자료를 기반으로 큐레이션했습니다.
      </p>

      <TabBar />
    </main>
  );
}
