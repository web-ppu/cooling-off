import { describe, it, expect } from 'vitest'

// 확장 사본
import {
  getCoolingDays as extGetCoolingDays,
  getCoolingEndsAt as extGetCoolingEndsAt,
} from '../src/shared/cooling'

// web 원본 (단일 진실 소스). 경로가 깨지면 web 쪽 cooling.ts가 이동/삭제된 것이므로 즉시 드러난다.
import {
  getCoolingDays as webGetCoolingDays,
  getCoolingEndsAt as webGetCoolingEndsAt,
} from '../../src/lib/cooling'

/**
 * tech-spec §2 드리프트 방지 스냅샷.
 * 확장 사본과 web 원본이 같은 냉각 정책을 내는지 고정 입력으로 검증한다.
 * web에서 cooling.ts를 바꾸면 이 테스트가 깨지고, 확장 사본도 같이 갱신해야 머지된다.
 */
const PRICE_RANGE = [
  1_000, 49_999, 50_000, 50_001, 100_000, 100_001, 300_000, 300_001, 1_000_000,
  1_000_001, 5_000_000,
]

describe('cooling 정책 web↔확장 동기화', () => {
  it.each(PRICE_RANGE)('getCoolingDays(%i)가 web과 일치한다', (price) => {
    expect(extGetCoolingDays(price)).toBe(webGetCoolingDays(price))
  })

  it.each(PRICE_RANGE)('getCoolingEndsAt(%i)의 일수 델타가 web과 일치한다', (price) => {
    const base = Date.now()
    const ext = extGetCoolingEndsAt(price)
    const web = webGetCoolingEndsAt(price)
    // setDate 기반이라 ms 단위 동일성 대신 "며칠 뒤"가 같은지 본다.
    const extDelta = Math.round((ext.getTime() - base) / 86_400_000)
    const webDelta = Math.round((web.getTime() - base) / 86_400_000)
    expect(extDelta).toBe(webDelta)
    expect(extDelta).toBe(extGetCoolingDays(price))
  })

  it('PRD 가격별 냉각기 기준값이 유지된다', () => {
    expect(extGetCoolingDays(50_000)).toBe(1)
    expect(extGetCoolingDays(100_000)).toBe(2)
    expect(extGetCoolingDays(300_000)).toBe(7)
    expect(extGetCoolingDays(1_000_000)).toBe(14)
    expect(extGetCoolingDays(1_000_001)).toBe(30)
  })
})
