// /privacy — 개인정보처리방침 (MVP 단계)
// 시니어 친화: 큰 글씨·짧은 문단·일상 표현
// 작성 기준: 2026년 5월 · 모두의 창업 공모전 출품작
import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 · 청바지",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[448px] flex-col bg-[var(--bg-page)] px-5 py-6">
      <header className="mb-6">
        <Link
          href="/welcome"
          className="inline-flex items-center gap-1 text-[14px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          ← 돌아가기
        </Link>
        <h1 className="mt-3 text-[26px] font-extrabold text-[var(--color-text)]">
          개인정보 처리방침
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted)]">
          시행일: 2026년 5월 12일 (MVP v1)
        </p>
      </header>

      {/* 한눈 요약 */}
      <section className="mb-6 rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--bg-soft-blue)] p-5">
        <p className="mb-3 text-[16px] font-extrabold text-[var(--color-text)]">
          🔒 한눈에 보는 개인정보 약속
        </p>
        <ul className="space-y-2 text-[14px] leading-relaxed text-[var(--color-text)]">
          <li className="flex gap-2">
            <span className="text-[var(--color-success)] font-bold">✓</span>
            <span>주민등록번호·계좌번호·카드번호는 절대 받지 않습니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-success)] font-bold">✓</span>
            <span>혜택·일자리·이웃 매칭에만 사용합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-success)] font-bold">✓</span>
            <span>외부 회사에 정보를 팔지 않습니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-success)] font-bold">✓</span>
            <span>언제든 삭제를 요청하실 수 있습니다</span>
          </li>
        </ul>
      </section>

      <Section title="1. 수집하는 개인정보 항목">
        <p className="mb-2">서비스 이용을 위해 다음 정보를 수집합니다.</p>
        <table className="w-full text-[14px]">
          <thead className="text-left text-[var(--color-muted)]">
            <tr>
              <th className="py-1 pr-2">구분</th>
              <th className="py-1">항목</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2 font-bold">필수</td>
              <td className="py-2">출생연도, 거주 시·도 및 시·군·구, 가구 형태</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2 font-bold">선택</td>
              <td className="py-2">
                월 가구 소득 구간, 야외 활동 가능 여부, 걷기 가능 정도, 희망
                근무일·시간대·시급, 관심 일자리 분야, 과거 경력 분야, 호칭(이름)
              </td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2 font-bold">자동</td>
              <td className="py-2">
                서비스 이용 기록(접속 시각·방문 페이지), 동네 코드(주소 입력
                기반의 행정동 코드)
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 rounded-lg bg-[var(--bg-soft-yellow)] p-3 text-[13px]">
          ⚠ <strong>받지 않는 정보</strong>: 주민등록번호, 계좌번호, 신용카드
          번호, 의료 기록, 종교, 사상, 정치 성향
        </p>
      </Section>

      <Section title="2. 개인정보의 수집·이용 목적">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>맞춤 매칭</strong>: 받으실 수 있는 복지 혜택·노인일자리·동네
            이웃 추천
          </li>
          <li>
            <strong>활동 포인트</strong>: 인지 게임·걷기·문화 활동 기록 및 포인트
            적립
          </li>
          <li>
            <strong>커뮤니티</strong>: 동네 단위 품앗이 게시판 운영 (동네 코드만
            노출, 상세 주소는 비공개)
          </li>
          <li>
            <strong>서비스 개선</strong>: 통계 분석 (개인 식별 불가능한 집계
            형태)
          </li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p className="mb-2">
          MVP 단계는 별도의 회원 가입 절차 없이 브라우저 쿠키로 임시 보관됩니다.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>쿠키 보관 기간</strong>: 최대 30일 (브라우저를 닫거나 쿠키
            삭제 시 즉시 소멸)
          </li>
          <li>
            <strong>커뮤니티 게시글</strong>: 작성자가 삭제하거나 신고 누적
            3회 시 자동 정지
          </li>
        </ul>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          정식 출시 시 별도의 보관 기간 정책이 공지될 예정입니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p className="rounded-lg bg-[var(--bg-soft-blue)] p-3 font-bold">
          🚫 운영자는 이용자의 개인정보를 외부에 제공하지 않습니다.
        </p>
        <p className="mt-3 text-[14px]">
          다음 예외의 경우에만 제공될 수 있습니다.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>법령에 따라 수사 기관의 요청이 있는 경우</li>
          <li>이용자가 명시적으로 동의한 경우</li>
        </ul>
      </Section>

      <Section title="5. 개인정보의 처리 위탁">
        <p>
          서비스 운영을 위해 다음 외부 서비스에 데이터 처리가 위탁됩니다.
        </p>
        <table className="mt-2 w-full text-[14px]">
          <thead className="text-left text-[var(--color-muted)]">
            <tr>
              <th className="py-1 pr-2">수탁자</th>
              <th className="py-1 pr-2">목적</th>
              <th className="py-1">위치</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2">Vercel Inc.</td>
              <td className="py-2 pr-2">웹 호스팅</td>
              <td className="py-2">미국·한국</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2">OpenAI</td>
              <td className="py-2 pr-2">AI 챗봇 응답 (입력 텍스트만)</td>
              <td className="py-2">미국</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="py-2 pr-2">Kakao</td>
              <td className="py-2 pr-2">주소 좌표 변환</td>
              <td className="py-2">한국</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="6. 이용자의 권리">
        <p className="mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>열람</strong>: 입력한 정보를 홈 화면 우측 상단의 프로필
            아이콘에서 확인
          </li>
          <li>
            <strong>정정</strong>: 인터뷰를 다시 진행해 정보를 새로 입력
          </li>
          <li>
            <strong>삭제</strong>: 브라우저 쿠키 삭제 또는 홈의 &ldquo;처음부터
            다시 시작&rdquo; 버튼
          </li>
          <li>
            <strong>이용 정지</strong>: 서비스 접속을 중단하시면 30일 후 자동
            소멸
          </li>
        </ul>
      </Section>

      <Section title="7. 만 14세 미만 아동의 개인정보">
        <p>
          본 서비스는 만 65세 이상 시니어 및 가족·보호자를 대상으로 합니다. 만
          14세 미만 아동의 회원 가입은 받지 않습니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호 책임자">
        <ul className="space-y-1">
          <li>
            <strong>책임자</strong>: 주상윤 (운영팀 대표)
          </li>
          <li>
            <strong>소속</strong>: 청바지(NowYouth) — 모두의 창업 공모전 출품팀
          </li>
          <li>
            <strong>연락</strong>: 공모전 사무국 또는 서비스 내{" "}
            <Link href="/community" className="underline text-[var(--color-primary)]">
              커뮤니티
            </Link>{" "}
            게시판
          </li>
        </ul>
      </Section>

      <Section title="9. 방침의 변경">
        <p>
          본 방침이 변경될 경우 서비스 내 공지 화면에서 사전에 안내합니다.
          중요한 변경 사항은 서비스 첫 진입 시 동의 절차를 다시 진행할 수
          있습니다.
        </p>
      </Section>

      <div className="mt-auto">
        <Link
          href="/welcome"
          className="btn-primary block rounded-2xl py-5 text-center text-[18px] font-bold"
        >
          돌아가기 →
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <h2 className="mb-3 text-[17px] font-extrabold text-[var(--color-text)]">
        {title}
      </h2>
      <div className="text-[15px] leading-relaxed text-[var(--color-text)]">
        {children}
      </div>
    </section>
  );
}
