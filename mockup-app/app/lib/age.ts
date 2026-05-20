// 만 나이 정밀 계산 헬퍼
//
// birthMonth가 주어지면 "올해 생일이 지났는지" 까지 반영하여 정확한 만 나이 산출.
// 주어지지 않으면 단순 연도 차이 (1년 오차 가능).

export function calculateAge(
  birthYear: number,
  birthMonth?: number | null,
  now: Date = new Date(),
): number {
  const yearDiff = now.getFullYear() - birthYear;
  if (!birthMonth || birthMonth < 1 || birthMonth > 12) return yearDiff;
  const currentMonth = now.getMonth() + 1; // 0-based → 1-based
  return currentMonth >= birthMonth ? yearDiff : yearDiff - 1;
}
