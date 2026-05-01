import Link from "next/link";
import { getBalance, getDemoUserId, getLedger, getUser } from "../lib/store";
import { rewards, totalRedeemed, isRedeemable } from "../lib/rewards";
import RedeemCard from "./redeem-card";

export const dynamic = "force-dynamic";

export default function RewardsPage() {
  const user = getUser(getDemoUserId());
  const balance = user ? getBalance(user.id) : 0;
  const ledger = user ? getLedger(user.id, 100) : [];
  const totalRedeemP = totalRedeemed(ledger);

  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] pb-24">
      <header className="px-5 pt-6 pb-4">
        <Link
          href="/activity"
          className="mb-4 inline-block text-[15px] font-bold text-[var(--color-primary)]"
        >
          ← 포인트 화면으로
        </Link>
        <h1 className="text-[24px] font-extrabold leading-tight text-[var(--color-text)]">
          포인트 교환
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          쌓인 포인트로 작은 선물을 받아보세요.
        </p>
      </header>

      <section className="hero-blue mx-5 mb-5 rounded-2xl p-5">
        <p className="text-[15px] font-medium text-white/80">사용 가능한 포인트</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[40px] font-extrabold leading-tight">
            {balance.toLocaleString()}
          </span>
          <span className="text-[18px] font-medium">P</span>
          <span className="ml-auto text-[13px] text-white/70">
            누적 사용 {totalRedeemP.toLocaleString()}P
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3 px-5">
        <h2 className="text-[19px] font-bold text-[var(--color-text)]">
          교환 가능한 리워드
        </h2>
        {rewards.map((item) => (
          <RedeemCard
            key={item.id}
            item={item}
            enabled={isRedeemable(balance, item)}
          />
        ))}
      </section>

      <section className="mx-5 mt-6 rounded-2xl border border-[var(--color-border)] bg-white/60 p-4">
        <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">
            교환 안내 (S1 단계)
          </span>
          <br />
          편의점 상품권은 월 1회 우편 발송. 약국·빵집 교환권은 지정 매장 방문 사용. S2부터는 카카오 기프티콘 즉시 발급으로 전환됩니다.
        </p>
      </section>
    </main>
  );
}
