/**
 * 가격에 따른 냉각 기간 (일 수) 반환
 * PRD 4절 가격별 냉각기 기준
 */
export function getCoolingDays(price: number): number {
  if (price <= 50000) return 1
  if (price <= 100000) return 2
  if (price <= 300000) return 7
  if (price <= 1000000) return 14
  return 30
}

/**
 * 가격에 따른 냉각 기간 라벨 (예: "7일")
 */
export function getCoolingDaysLabel(price: number): string {
  return `${getCoolingDays(price)}일`
}

/**
 * 냉각 종료 시각 계산
 */
export function getCoolingEndsAt(price: number): Date {
  const days = getCoolingDays(price)
  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + days)
  return endsAt
}

// 표시용 tier 테이블. 활성 tier 선택은 getCoolingDays와 동일하게 `price <= max`로 한다
// (경계값에서 표시 tier와 실제 냉각일이 어긋나지 않도록).
export const COOLING_TIERS = [
  { label: '5만원 이하', days: '1일', min: 0, max: 50000 },
  { label: '5만~10만원', days: '2일', min: 50000, max: 100000 },
  { label: '10만~30만원', days: '7일', min: 100000, max: 300000 },
  { label: '30만~100만원', days: '14일', min: 300000, max: 1000000 },
  { label: '100만원 초과', days: '30일', min: 1000000, max: Infinity },
] as const
