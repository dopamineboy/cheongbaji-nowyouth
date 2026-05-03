// 성취 배지 — ledger 이력 기반으로 자동 계산
import type { LedgerEntry, LedgerType } from "./types";

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  progress?: { current: number; target: number };
}

function countByType(ledger: LedgerEntry[], type: LedgerType): number {
  return ledger.filter((e) => e.type === type).length;
}

function totalAmount(ledger: LedgerEntry[]): number {
  return ledger
    .filter((e) => e.amount > 0)
    .reduce((acc, e) => acc + e.amount, 0);
}

export function computeBadges(ledger: LedgerEntry[]): Badge[] {
  const games = countByType(ledger, "GAME");
  const learns = countByType(ledger, "LEARN");
  const welfare = countByType(ledger, "WELFARE");
  const job = countByType(ledger, "JOB");
  const poomasi = countByType(ledger, "POOMASI");
  const total = totalAmount(ledger);

  return [
    {
      id: "first-step",
      name: "첫 발걸음",
      icon: "🌱",
      description: "처음으로 포인트를 받으셨어요",
      earned: ledger.length > 0,
    },
    {
      id: "brain-warmup",
      name: "두뇌 운동 시작",
      icon: "🧠",
      description: "인지 게임 5번 완료",
      earned: games >= 5,
      progress: { current: games, target: 5 },
    },
    {
      id: "scholar",
      name: "복지 박사",
      icon: "📚",
      description: "복지 학습 퀴즈 10문제",
      earned: learns >= 10,
      progress: { current: learns, target: 10 },
    },
    {
      id: "welfare-saver",
      name: "혜택 챙기는 분",
      icon: "💰",
      description: "복지 혜택 신청 1건",
      earned: welfare >= 1,
      progress: { current: welfare, target: 1 },
    },
    {
      id: "job-seeker",
      name: "일자리 탐험가",
      icon: "💼",
      description: "관심 있는 일자리 3건",
      earned: job >= 3,
      progress: { current: job, target: 3 },
    },
    {
      id: "good-neighbor",
      name: "이웃 사촌",
      icon: "🤝",
      description: "커뮤니티 1회 참여",
      earned: poomasi >= 1,
      progress: { current: poomasi, target: 1 },
    },
    {
      id: "thousand",
      name: "천 포인트 클럽",
      icon: "⭐",
      description: "누적 1,000P 적립",
      earned: total >= 1000,
      progress: { current: total, target: 1000 },
    },
  ];
}
