// 활동 이력(LedgerRow) 아이콘 — 이모지 대신 인라인 SVG로 교체.
// 안드로이드(특히 삼성)의 Circle to Search / Bixby Vision이 이모지를 이미지로 인식해
// long-press 시 검색 오버레이가 뜨는 문제 차단 — SVG는 이미지가 아니라 그래픽이라
// 시스템이 이미지 검색 대상으로 인식하지 않는다.
//
// stroke 기반(lucide-icons 스타일) 단일 색상.
import type { LedgerType } from "../lib/types";

type IconProps = { className?: string; size?: number };

function Svg({
  size = 24,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// 인지 게임 — 퍼즐 조각
function GameIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19 11h-2a2 2 0 1 1 0-4V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2 2 2 0 0 1-4 0 2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2 2 2 0 1 1 0 4 2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 1 4 0 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4Z" />
    </Svg>
  );
}

// 학습 퀴즈 — 전구
function LearnIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
    </Svg>
  );
}

// 걷기 — 사람
function WalkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="13" cy="4" r="2" />
      <path d="M4 22l3-7 4-2-1-5 5 4 3 1" />
      <path d="M11 13l1 7" />
    </Svg>
  );
}

// 스탬프 — 도장(체크 도장)
function StampIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v6" />
      <path d="M9 9h6l1 4H8l1-4Z" />
      <path d="M4 17h16" />
      <path d="M5 21h14" />
    </Svg>
  );
}

// 문화 활동 — 가면(공연)
function CultureIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v6a8 8 0 0 1-16 0V6Z" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M9 14c.8 1 2 1.5 3 1.5s2.2-.5 3-1.5" />
    </Svg>
  );
}

// 이벤트 — 깃발
function EventIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 3v18" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </Svg>
  );
}

// 혜택 신청 — 문서 클립보드
function WelfareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
      <path d="M9 19h3" />
    </Svg>
  );
}

// 일자리 — 서류가방
function JobIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </Svg>
  );
}

// 커뮤니티 — 말풍선
function PoomasiIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12a8 8 0 0 1-12 6.9L4 21l1.5-4.5A8 8 0 1 1 21 12Z" />
    </Svg>
  );
}

// 리워드 교환 — 선물 상자
function RedeemIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="9" width="18" height="12" rx="1" />
      <path d="M3 13h18" />
      <path d="M12 9v12" />
      <path d="M12 9c-3 0-5-1-5-3s2-3 3-2.5S12 7 12 9Z" />
      <path d="M12 9c3 0 5-1 5-3s-2-3-3-2.5S12 7 12 9Z" />
    </Svg>
  );
}

// 조정(ADMIN_ADJUST) — 톱니바퀴
function AdminAdjustIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Svg>
  );
}

// 기타(•) 폴백
function DotIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </Svg>
  );
}

export const LEDGER_ICON: Record<LedgerType, (p: IconProps) => React.JSX.Element> = {
  GAME: GameIcon,
  LEARN: LearnIcon,
  WALK: WalkIcon,
  STAMP: StampIcon,
  CULTURE: CultureIcon,
  EVENT: EventIcon,
  WELFARE: WelfareIcon,
  JOB: JobIcon,
  POOMASI: PoomasiIcon,
  REDEEM: RedeemIcon,
  ADMIN_ADJUST: AdminAdjustIcon,
};

export const LedgerFallbackIcon = DotIcon;
