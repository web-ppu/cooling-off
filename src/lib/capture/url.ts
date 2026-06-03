/**
 * URL 정규화, allowlist 판단, SSRF 방지 검증.
 * 캡처 흐름 전체에서 외부 URL을 다루기 전 반드시 거쳐야 한다.
 */

const ALLOWED_HOSTS: { match: RegExp; site: string }[] = [
  { match: /(^|\.)coupang\.com$/i, site: 'coupang' },
  { match: /(^|\.)shopping\.naver\.com$/i, site: 'naver' },
  { match: /(^|\.)smartstore\.naver\.com$/i, site: 'naver' },
  { match: /(^|\.)naver\.me$/i, site: 'naver' },
  { match: /(^|\.)musinsa\.com$/i, site: 'musinsa' },
]

export type SupportedSite = 'coupang' | 'naver' | 'musinsa'

export interface NormalizedUrl {
  url: string
  host: string
  site: SupportedSite | null
}

/** 유저 입력에서 URL 후보를 추출한다. share_target의 text/title에도 사용된다. */
export function extractUrlCandidate(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // 입력이 그대로 URL인 경우 우선
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    // ignore — text 안에서 추출 시도
  }

  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i)
  return match ? match[0] : null
}

/** http/https 만 통과시킨다. 그 외 스킴은 거부. */
export function normalizeUrl(raw: string): NormalizedUrl | null {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null

  // 쿠팡 등 일부 사이트의 추적 파라미터 제거
  const TRACK_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  for (const p of TRACK_PARAMS) parsed.searchParams.delete(p)

  const host = parsed.hostname.toLowerCase()
  const site = (ALLOWED_HOSTS.find((h) => h.match.test(host))?.site as SupportedSite | undefined) ?? null
  return { url: parsed.toString(), host, site }
}

/** SSRF 방지: 사설망/로컬/링크-로컬/IPv6 ULA 등 차단. */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h === 'broadcasthost') return true

  // IPv4
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map((n) => parseInt(n, 10))
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast + reserved
    return false
  }

  // IPv6 (대괄호로 감싸 들어올 수 있음)
  const v6 = h.replace(/^\[|\]$/g, '')
  if (v6.includes(':')) {
    if (v6 === '::1' || v6 === '::') return true
    if (/^fe[89ab][0-9a-f]:/i.test(v6)) return true // link-local
    if (/^f[cd][0-9a-f]{2}:/i.test(v6)) return true // ULA
    // IPv4-mapped(::ffff:1.2.3.4) 은 매핑된 IPv4 로 사설망 여부를 재평가한다.
    // public IPv4(::ffff:8.8.8.8)까지 무조건 막지 않도록.
    const mapped = v6.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i)
    if (mapped) return isPrivateHost(mapped[1])
    if (/^::ffff:/i.test(v6)) return true // 16진 표기 매핑 등은 보수적으로 차단
    return false
  }

  return false
}
