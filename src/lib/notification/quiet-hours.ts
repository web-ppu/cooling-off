/**
 * KST(UTC+9) 기준 야간 시간대 판정.
 *
 * 정책 (docs/pm/notification-policy.md §5):
 *   "발송 시간 | KST 22:00~08:00에는 보내지 않고 다음 08:00 이후로 미룸"
 *
 * Cron 자체는 매 시각마다 돌 수 있지만, 야간이면 dispatch 를 skip 한다.
 * 야간 동안 ready 가 된 항목은 cooling_notified_at 이 null 로 남아 있다가
 * 다음 비-야간 cron 실행에서 정상 발송된다.
 */

/** UTC 시각으로부터 KST 시(hour) 를 추출 (0~23). */
export function getKstHour(date: Date): number {
  return (date.getUTCHours() + 9) % 24
}

/**
 * KST 22:00 ~ 다음날 08:00 사이인지 판정.
 * - true: 발송 금지 시간대
 * - false: 발송 가능 시간대 (KST 08:00 이상 22:00 미만)
 */
export function isQuietHourKst(date: Date = new Date()): boolean {
  const h = getKstHour(date)
  return h >= 22 || h < 8
}
