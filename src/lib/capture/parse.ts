/**
 * URL fetch + OG/가격 후보 파싱.
 * SSRF 방지는 url.ts에서 수행한 뒤 호출한다.
 *
 * MVP는 완벽 파싱을 목표로 하지 않는다. 실패는 오류가 아니라
 * 사용자에게 보완 입력을 받기 위한 신호다.
 */

import { isPrivateHost, normalizeUrl, type SupportedSite } from './url'
import { lookup } from 'dns/promises'

const FETCH_TIMEOUT_MS = 6000
const MAX_BYTES = 800_000 // 0.8MB 이상은 잘라서 본다
const MAX_REDIRECTS = 3
const USER_AGENT =
  'Mozilla/5.0 (compatible; CoolingOffBot/1.0; +https://cooling-off.local)'

export interface ParsedPreview {
  url: string
  host: string
  site: SupportedSite | null
  name: string | null
  price: number | null
  imageUrl: string | null
  /** 자동 파싱이 가능한 도메인이었는지 */
  supported: boolean
  /** allowlist 밖이라 fetch 하지 않은 경우 true */
  skipped: boolean
}

export type ParseResult =
  | { ok: true; preview: ParsedPreview }
  // fetch 실패/용량초과는 에러가 아니라 수동입력 폴백(ok:true)으로 처리한다.
  // 여기 남는 건 사용자가 진행할 수 없는 진짜 오류뿐이다.
  | { ok: false; error: 'invalid_url' | 'blocked_host' }

/** allowlist 밖 URL은 fetch 하지 않고 URL만 저장 대상으로 표시한다. */
export async function parsePreview(rawUrl: string): Promise<ParseResult> {
  const normalized = normalizeUrl(rawUrl)
  if (!normalized) return { ok: false, error: 'invalid_url' }

  if (isPrivateHost(normalized.host)) return { ok: false, error: 'blocked_host' }
  if (!(await isPublicResolvable(normalized.host))) {
    return { ok: false, error: 'blocked_host' }
  }

  // 지원 사이트 밖이면 자동 fetch 하지 않는다 (capture-tech-spec §6).
  if (!normalized.site) {
    return {
      ok: true,
      preview: {
        url: normalized.url,
        host: normalized.host,
        site: null,
        name: null,
        price: null,
        imageUrl: null,
        supported: false,
        skipped: true,
      },
    }
  }

  const html = await safeFetchHtml(normalized.url)
  if (html === 'fetch_failed' || html === 'too_large') {
    // 지원 사이트라도 쿠팡(403)·네이버(429)처럼 봇 차단되면 본문을 못 읽는다.
    // 이건 오류가 아니라 "URL은 살리고 이름·가격만 직접 입력" 폴백이다 (PRD §7 partial/total-fail).
    // blocked_host·invalid_url 만 진짜 에러로 남긴다.
    return {
      ok: true,
      preview: {
        url: normalized.url,
        host: normalized.host,
        site: normalized.site,
        name: null,
        price: null,
        imageUrl: null,
        supported: true,
        skipped: false,
      },
    }
  }

  const og = parseOg(html)
  const price = parsePrice(html)

  return {
    ok: true,
    preview: {
      url: normalized.url,
      host: normalized.host,
      site: normalized.site,
      name: og.title,
      price,
      imageUrl: og.image,
      supported: true,
      skipped: false,
    },
  }
}

/**
 * 호스트 이름의 DNS 결과가 public IP인지 확인.
 * URL 단계에서는 호스트 문자열만 보지만, 실제 SSRF는 resolve 후 결정된다.
 */
async function isPublicResolvable(host: string): Promise<boolean> {
  // 이미 IP literal인 경우 url.isPrivateHost가 처리하므로 통과시킨다.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return true
  try {
    const records = await lookup(host, { all: true })
    if (records.length === 0) return false
    return records.every((r) => !isPrivateHost(r.address))
  } catch {
    return false
  }
}

async function safeFetchHtml(
  url: string,
  redirectsLeft = MAX_REDIRECTS
): Promise<string | 'fetch_failed' | 'too_large'> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    })

    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location')
      if (!next) return 'fetch_failed'
      if (redirectsLeft <= 0) return 'fetch_failed'
      const nextNormalized = normalizeUrl(new URL(next, url).toString())
      if (!nextNormalized) return 'fetch_failed'
      if (isPrivateHost(nextNormalized.host)) return 'fetch_failed'
      if (!(await isPublicResolvable(nextNormalized.host))) return 'fetch_failed'
      return safeFetchHtml(nextNormalized.url, redirectsLeft - 1)
    }

    if (!res.ok || !res.body) return 'fetch_failed'

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let received = 0
    let html = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > MAX_BYTES) {
        html += decoder.decode(value.slice(0, Math.max(0, MAX_BYTES - (received - value.byteLength))))
        try {
          await reader.cancel()
        } catch {
          // ignore
        }
        break
      }
      html += decoder.decode(value, { stream: true })
    }
    return html
  } catch {
    return 'fetch_failed'
  } finally {
    clearTimeout(timer)
  }
}

interface OgResult {
  title: string | null
  image: string | null
}

function parseOg(html: string): OgResult {
  const head = html.slice(0, 200_000)
  const title =
    metaContent(head, 'property', 'og:title') ??
    metaContent(head, 'name', 'twitter:title') ??
    extractTitleTag(head)
  const image = metaContent(head, 'property', 'og:image') ?? metaContent(head, 'name', 'twitter:image')

  return {
    title: title ? cleanTitle(decodeEntities(title)) : null,
    image: image ? decodeEntities(image).trim() || null : null,
  }
}

/**
 * og:title에서 사이트 꼬리표를 떼고 이름 한도(40자)에 맞춘다.
 * 예) "...니트 - 8color - 사이즈 & 후기 | 무신사" → "...니트 - 8color"
 * 40자는 captureItem 검증·입력 maxLength와 동일해야 한다.
 */
function cleanTitle(raw: string): string | null {
  let t = raw.trim()
  // 끝에 붙는 "| 무신사", "- 무신사", ": 네이버쇼핑", "| 쿠팡" 등 사이트명 제거
  t = t.replace(/\s*[|:\-–]\s*(무신사|MUSINSA|네이버\s*쇼핑|네이버쇼핑|쿠팡|coupang|smartstore)\s*$/i, '')
  // 무신사 특유의 "- 사이즈 & 후기" / "- 후기" 꼬리 제거
  t = t.replace(/\s*-\s*(사이즈\s*&\s*후기|후기|사이즈)\s*$/i, '')
  t = t.trim()
  return t.slice(0, 40) || null
}

function metaContent(html: string, attr: 'property' | 'name', key: string): string | null {
  const re = new RegExp(
    `<meta\\s+[^>]*${attr}=["']${escapeRegex(key)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  )
  const m = html.match(re)
  if (m) return m[1]
  const reSwap = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escapeRegex(key)}["'][^>]*>`,
    'i'
  )
  const m2 = html.match(reSwap)
  return m2 ? m2[1] : null
}

function extractTitleTag(html: string): string | null {
  const m = html.match(/<title>([^<]+)<\/title>/i)
  return m ? m[1] : null
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * 가격 후보를 추정한다. 실패해도 무방하다.
 * 사이트별 selector 대신 og:price/JSON-LD/가격 키워드 인근 숫자를 본다.
 */
function parsePrice(html: string): number | null {
  // 1. <meta property="product:price:amount" content="...">
  const ogPrice =
    metaContent(html, 'property', 'product:price:amount') ??
    metaContent(html, 'property', 'og:price:amount')
  if (ogPrice) {
    const n = toWonNumber(ogPrice)
    if (n) return n
  }

  // 2. JSON-LD Product schema
  const ldMatches = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)
  if (ldMatches) {
    for (const block of ldMatches) {
      const inner = block.replace(/<script[^>]*>|<\/script>/gi, '')
      try {
        const json = JSON.parse(inner)
        const price = findLdPrice(json)
        if (price) return price
      } catch {
        // ignore
      }
    }
  }

  // 3. 가격 키워드 인근 숫자 (마지막 fallback)
  const KEYWORD_RE = /(판매가|가격|총\s*금액|할인\s*가)[^\d]{0,30}([\d,]{3,})\s*원/
  const km = html.match(KEYWORD_RE)
  if (km) {
    const n = toWonNumber(km[2])
    if (n && n >= 100) return n
  }
  return null
}

interface LdNode {
  '@type'?: string | string[]
  offers?: LdNode | LdNode[]
  price?: string | number
  priceSpecification?: LdNode | LdNode[]
  [key: string]: unknown
}

function findLdPrice(node: unknown): number | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findLdPrice(item)
      if (found) return found
    }
    return null
  }
  if (typeof node !== 'object') return null
  const n = node as LdNode
  if (n.price !== undefined) {
    const price = toWonNumber(String(n.price))
    if (price) return price
  }
  if (n.offers) {
    const found = findLdPrice(n.offers)
    if (found) return found
  }
  if (n.priceSpecification) {
    const found = findLdPrice(n.priceSpecification)
    if (found) return found
  }
  return null
}

function toWonNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const num = Math.round(parseFloat(cleaned))
  if (!Number.isFinite(num)) return null
  if (num < 1 || num > 999_999_999) return null
  return num
}
