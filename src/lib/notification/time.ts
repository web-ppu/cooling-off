/**
 * KST(UTC+9) 기준 시간 헬퍼.
 *
 * 알림 정책상 "오늘 등록된 첫 번째 항목" 판정은 KST 자정 기준으로 한다.
 * 서버가 어느 region 에 있든 결과가 동일하도록, 명시적으로 UTC offset 을 계산한다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 오늘(KST) 00:00 의 UTC 타임스탬프(ISO string)를 반환한다.
 * Supabase 의 timestamptz 컬럼 비교에 그대로 쓸 수 있다.
 */
export function getKstTodayStartUtcIso(now: Date = new Date()): string {
  // 현재 UTC 시각에 KST offset 을 더한 "가상의 KST 시각"
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)
  // 가상 KST 시각의 자정 (UTC 의 00:00 로 다룸)
  const kstMidnightAsUtc = new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    )
  )
  // 실제 UTC 로 환산 (가상 KST 00:00 - 9h = 진짜 UTC 어제 15:00)
  const utcMidnight = new Date(kstMidnightAsUtc.getTime() - KST_OFFSET_MS)
  return utcMidnight.toISOString()
}

/**
 * cooling_ends_at 같은 ISO 타임스탬프를 KST 기준 "5월 29일 14:00" 형태로 포맷.
 * 알림 권한 제안 카드 본문에 사용된다.
 */
export function formatKstShortDateTime(iso: string): string {
  const date = new Date(iso)
  const datePart = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date)
  return `${datePart} ${timePart}`
}
