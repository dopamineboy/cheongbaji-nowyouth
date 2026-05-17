// /terms — 이용약관 (MVP 단계)
// 시니어 친화: 큰 글씨·짧은 문단·일상 표현
// 작성 기준: 2026년 5월 · 모두의 창업 공모전 출품작 (예비창업자: 주상윤)
import Link from "next/link";

export const metadata = {
  title: "이용약관 · 청바지",
};

export default function TermsPage() {
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
          이용약관
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted)]">
          시행일: 2026년 5월 12일 (MVP v1)
        </p>
      </header>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 청바지(NowYouth, 이하 &ldquo;서비스&rdquo;)가 제공하는
          복지·일자리·활동·커뮤니티 통합 서비스를 이용함에 있어 운영자와 이용자의
          권리·의무·책임 사항을 정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (정의)">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>서비스</strong>: 청바지(NowYouth) 모바일·웹 애플리케이션을 통한
            복지 큐레이션, 노인일자리 매칭, 활동 포인트, 품앗이 커뮤니티 기능
          </li>
          <li>
            <strong>이용자</strong>: 본 약관에 동의하고 서비스에 접속해 이용하는 자
          </li>
          <li>
            <strong>운영자</strong>: 주상윤 (예비창업자, 모두의 창업 공모전 출품팀)
          </li>
        </ul>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <p>
          본 약관은 서비스에 접속한 시점부터 효력이 발생합니다. 운영자는 관계법령을
          위반하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 사전에 서비스
          내 공지를 통해 안내합니다.
        </p>
      </Section>

      <Section title="제4조 (서비스의 제공)">
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            서비스는 공공데이터(복지로·한국노인인력개발원·통계청 등)를 기반으로
            개인 맞춤 추천을 제공합니다.
          </li>
          <li>
            서비스의 추천 결과는 참고용이며, 실제 수급 자격·신청 가능 여부는 해당
            기관(행정복지센터·복지로·노인인력개발원 등)에서 최종 확인됩니다.
          </li>
          <li>
            현재 단계는 MVP(최소기능제품)로, 일부 기능이 시연 목적의 예시
            데이터로 동작할 수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제5조 (이용자의 의무)">
        <p>
          이용자는 다음 행위를 하여서는 안 됩니다.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>타인의 개인정보를 도용하거나 허위 정보를 입력하는 행위</li>
          <li>서비스의 운영을 방해하거나 시스템에 무단으로 접근하는 행위</li>
          <li>금융·투자·종교 등 부적절한 권유를 커뮤니티에 게시하는 행위</li>
          <li>법령·공서양속에 위반되는 일체의 행위</li>
        </ul>
      </Section>

      <Section title="제6조 (서비스 이용 제한)">
        <p>
          이용자가 본 약관을 위반하거나 부적절한 행위를 한 경우, 운영자는 사전
          통지 없이 서비스 이용을 제한할 수 있습니다. 커뮤니티 게시글의 경우
          신고 누적 3회 시 자동으로 노출이 정지됩니다.
        </p>
      </Section>

      <Section title="제7조 (면책 조항)">
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            운영자는 천재지변, 통신 장애, 공공데이터 출처의 오류 등 불가항력적
            사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.
          </li>
          <li>
            서비스가 제공하는 추천·매칭 결과는 참고 정보이며, 이를 근거로 한
            의사 결정으로 발생한 결과에 대해 운영자는 직접적 책임을 지지
            않습니다.
          </li>
          <li>
            이용자 간 커뮤니티 활동에서 발생한 분쟁에 대해 운영자는 중재 의무를
            지지 않으며, 당사자 간 해결을 원칙으로 합니다.
          </li>
        </ol>
      </Section>

      <Section title="제8조 (개인정보의 보호)">
        <p>
          개인정보의 수집·이용에 관한 사항은 별도의{" "}
          <Link
            href="/privacy"
            className="font-bold text-[var(--color-primary)] underline"
          >
            개인정보처리방침
          </Link>
          을 따릅니다.
        </p>
      </Section>

      <Section title="제9조 (분쟁 해결)">
        <p>
          본 약관과 관련된 분쟁은 대한민국 법령을 따르며, 협의가 이루어지지
          않는 경우 운영자 주소지 관할 법원을 합의 관할로 합니다.
        </p>
      </Section>

      <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <p className="text-[14px] font-bold text-[var(--color-text)]">문의</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
          본 서비스는 &ldquo;모두의 창업&rdquo; 공모전 출품작이며, 운영 문의는
          공모전 사무국 또는 운영팀을 통해 가능합니다.
        </p>
      </section>

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
