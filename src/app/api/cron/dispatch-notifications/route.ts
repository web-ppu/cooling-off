import { NextRequest, NextResponse } from 'next/server'
import { dispatchNotifications } from '@/lib/notification/dispatch'
import { isQuietHourKst } from '@/lib/notification/quiet-hours'

/**
 * Vercel Cron 엔드포인트 — 냉각 만료 푸시 발송.
 *
 * 설정: vercel.json 의 crons 필드.
 *   - Hobby 플랜: 일 1회 (현재 `0 3 * * *` = KST 12:00 점심 시간)
 *   - Pro 플랜으로 업그레이드 시: `*\/15 * * * *` 등 빈번한 스케줄 가능
 *     → ready 전환 ~ 알림 도달 지연을 최대 15분으로 줄일 수 있음
 *
 * 인증: Vercel cron 은 자동으로 `Authorization: Bearer ${CRON_SECRET}` 헤더를
 * 붙여 요청한다. CRON_SECRET 은 Vercel 환경변수에 등록한다.
 *
 * 응답: 시도/성공/삭제/에러 통계. 5xx 는 예외 시에만 반환.
 *
 * 야간 정책: KST 22:00~08:00 사이면 dispatch 자체를 skip 한다.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // 1) cron 인증
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron dispatch] CRON_SECRET 미설정')
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2) 야간 시간대 (KST 22~08) skip
  if (isQuietHourKst()) {
    return NextResponse.json({ skipped: 'quiet-hours-kst' })
  }

  // 3) 발송
  try {
    const result = await dispatchNotifications()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron dispatch] unexpected error:', err)
    return NextResponse.json(
      { error: 'dispatch failed' },
      { status: 500 }
    )
  }
}
