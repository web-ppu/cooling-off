'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { captureItem, fetchPreview } from '@/app/capture/actions'
import { getCoolingDaysLabel } from '@/lib/cooling'
import { formatKRW } from '@/lib/format'

type PreviewState =
  | { phase: 'idle' }
  | { phase: 'fetching' }
  | {
      phase: 'ready'
      url: string
      host: string
      supported: boolean
      skipped: boolean
      autoName: string | null
      autoPrice: number | null
      imageUrl: string | null
      duplicateOfId: string | null
    }
  | { phase: 'error'; message: string }

interface Props {
  initialUrl: string
  source: 'ios-shortcut' | 'pwa-share' | null
}

export default function CaptureForm({ initialUrl, source }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [preview, setPreview] = useState<PreviewState>({ phase: 'idle' })
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const autoFetchedRef = useRef(false)

  const priceNum = parseInt(price.replace(/[^\d]/g, '') || '0', 10)
  const priceDisplay = price === '' ? '' : priceNum.toLocaleString('ko-KR')

  const nameErr = !name.trim()
    ? '이름을 입력해 주세요'
    : name.length > 40
      ? '40자 이내로 입력해 주세요'
      : ''
  const priceErr = !price
    ? '가격을 입력해 주세요'
    : priceNum < 1
      ? '1원 이상으로 입력해 주세요'
      : priceNum > 999999999
        ? '999,999,999원 이하로 입력해 주세요'
        : ''
  const reasonErr = reason.length > 200 ? '200자 이내로 입력해 주세요' : ''
  const cooling = priceNum >= 1 ? getCoolingDaysLabel(priceNum) : null

  const isReady = preview.phase === 'ready'
  const duplicateBlocked =
    isReady && preview.duplicateOfId && !acknowledgedDuplicate
  const valid =
    isReady && !nameErr && !priceErr && !reasonErr && price !== '' && !duplicateBlocked

  // ?url= 쿼리로 진입했으면 자동 파싱
  useEffect(() => {
    if (autoFetchedRef.current) return
    if (!initialUrl) return
    autoFetchedRef.current = true
    void runFetch(initialUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl])

  async function runFetch(target: string) {
    setServerError(null)
    setAcknowledgedDuplicate(false)
    setPreview({ phase: 'fetching' })
    try {
      const res = await fetchPreview(target)
      if (!res.ok) {
        setPreview({ phase: 'error', message: res.error })
        return
      }
      setPreview({
        phase: 'ready',
        url: res.preview.url,
        host: res.preview.host,
        supported: res.preview.supported,
        skipped: res.preview.skipped,
        autoName: res.preview.name,
        autoPrice: res.preview.price,
        imageUrl: res.preview.imageUrl,
        duplicateOfId: res.duplicateOfId,
      })
      if (res.preview.name && !name) setName(res.preview.name)
      if (res.preview.price && !price) setPrice(String(res.preview.price))
      setUrl(res.preview.url)
    } catch (err) {
      console.error('[capture] fetchPreview', err)
      setPreview({
        phase: 'error',
        message: '연결이 불안정합니다. 잠시 후 다시 시도해 주세요.',
      })
    }
  }

  function handleFetchClick(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    void runFetch(url.trim())
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setPrice(raw)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched({ name: true, price: true, reason: true })
    if (!valid) return

    const formData = new FormData()
    formData.set('name', name)
    formData.set('price', String(priceNum))
    formData.set('url', isReady ? preview.url : url)
    formData.set('reason', reason)

    setServerError(null)
    startTransition(async () => {
      try {
        const result = await captureItem(formData)
        if (result && !result.success) setServerError(result.error)
      } catch (err) {
        console.error('[capture] submit', err)
        setServerError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SourceBadge source={source} />

      {/* URL 입력 + 가져오기 */}
      <form onSubmit={handleFetchClick} className="doc-form">
        <div className="doc-row" style={{ borderBottom: 'none' }}>
          <div className="doc-row-num">U</div>
          <div className="doc-row-body">
            <div className="doc-row-label">URL · 상품 링크</div>
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <input
                className="field-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={preview.phase === 'fetching' || isPending}
              />
              <button
                type="submit"
                disabled={!url.trim() || preview.phase === 'fetching' || isPending}
                className="inline-flex shrink-0 items-center justify-center border-2 border-[var(--line-default)] bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-2)] disabled:opacity-30"
              >
                {preview.phase === 'fetching' ? '가져오는 중…' : '상품 정보 가져오기'}
              </button>
            </div>
            <PreviewStatus preview={preview} />
          </div>
        </div>
      </form>

      {/* 보완 폼 + 확인 화면 */}
      {(preview.phase === 'ready' || preview.phase === 'error') && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="doc-form">
            {isReady && preview.duplicateOfId && (
              <DuplicateNotice
                duplicateId={preview.duplicateOfId}
                acknowledged={acknowledgedDuplicate}
                onAck={() => setAcknowledgedDuplicate(true)}
              />
            )}

            {isReady && preview.imageUrl && (
              <div
                className="flex items-center justify-center"
                style={{
                  padding: 18,
                  borderBottom: '2px solid var(--line-default)',
                  background: 'var(--surface-2)',
                }}
              >
                {/* 외부 이미지지만 가벼운 미리보기. next/image 대신 native img를 쓴다. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.imageUrl}
                  alt=""
                  style={{
                    maxHeight: 160,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    border: '2px solid var(--line-default)',
                    background: '#fff',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* A: 이름 */}
            <div className="doc-row">
              <div className="doc-row-num">A</div>
              <div className="doc-row-body">
                <div className="doc-row-label">
                  NAME · 이름
                  {isReady && preview.autoName && (
                    <span className="opt"> (자동)</span>
                  )}
                </div>
                <input
                  className="field-input"
                  placeholder="예: 에어팟 프로3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  maxLength={40}
                  disabled={isPending}
                />
                {touched.name && nameErr && (
                  <div className="field-error">{nameErr}</div>
                )}
              </div>
            </div>

            {/* B: 가격 */}
            <div className="doc-row">
              <div className="doc-row-num">B</div>
              <div className="doc-row-body">
                <div className="doc-row-label">
                  PRICE · 가격 <span className="opt">(₩)</span>
                  {isReady && preview.autoPrice && (
                    <span className="opt"> · 자동</span>
                  )}
                  {isReady && !preview.autoPrice && preview.supported && (
                    <span className="opt"> · 직접 입력</span>
                  )}
                </div>
                <input
                  className="field-input"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  placeholder="0"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  onBlur={() => setTouched((p) => ({ ...p, price: true }))}
                  disabled={isPending}
                />
                {touched.price && priceErr && (
                  <div className="field-error">{priceErr}</div>
                )}
                {cooling && (
                  <div className="field-help">
                    {formatKRW(priceNum)} · 냉각 {cooling}
                  </div>
                )}
              </div>
            </div>

            {/* C: 이유 (선택) */}
            <div className="doc-row" style={{ borderBottom: 'none' }}>
              <div className="doc-row-num accent">C</div>
              <div className="doc-row-body">
                <div className="doc-row-label">
                  REASON · 사고 싶은 이유 <span className="opt">(선택)</span>
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="비워둬도 괜찮습니다. AI 채팅의 출발점이 됩니다."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={isPending}
                />
                <div className="flex justify-between">
                  <span className="field-help">
                    {reasonErr || '비워둬도 괜찮습니다'}
                  </span>
                  <span
                    className="field-help"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {reason.length}/200
                  </span>
                </div>
              </div>
            </div>

            <div className="doc-form-foot">
              <span
                className="doc-meta-row doc-form-foot-sign"
                style={{ borderTop: 'none', padding: 0, margin: 0 }}
              >
                SIGN · _________________
              </span>
              <div className="doc-form-foot-actions flex gap-2.5">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center border-2 border-[var(--line-default)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={!valid || isPending}
                  className="inline-flex items-center justify-center border-2 border-[var(--line-default)] bg-[var(--ink)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-2)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {isPending ? '등록 중…' : '냉각 시작 →'}
                </button>
              </div>
            </div>
          </div>

          {serverError && (
            <div
              className="mt-3 border-2 px-4 py-3 text-sm"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              {serverError}
            </div>
          )}
        </form>
      )}

      <PlatformGuide />
    </div>
  )
}

function SourceBadge({ source }: { source: 'ios-shortcut' | 'pwa-share' | null }) {
  if (!source) return null
  const label =
    source === 'ios-shortcut' ? '단축어로 받은 링크' : '공유로 받은 링크'
  return (
    <div
      className="border-2 px-4 py-2 text-sm"
      style={{
        borderColor: 'var(--line-default)',
        background: 'var(--accent-soft)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </div>
  )
}

function PreviewStatus({ preview }: { preview: PreviewState }) {
  if (preview.phase === 'idle')
    return (
      <div className="field-help">
        공유, 단축어, 직접 붙여넣기로 받은 URL이면 자동으로 상품 정보를
        가져옵니다.
      </div>
    )
  if (preview.phase === 'fetching')
    return <div className="field-help">상품 정보를 가져오는 중입니다…</div>
  if (preview.phase === 'error')
    return (
      <div className="field-error" role="alert">
        {preview.message}
      </div>
    )
  if (preview.skipped) {
    return (
      <div className="field-help">
        지원하지 않는 사이트({preview.host})입니다. 상품명과 가격을 직접 입력해
        주세요.
      </div>
    )
  }
  const okBits: string[] = []
  if (preview.autoName) okBits.push('이름')
  if (preview.autoPrice) okBits.push('가격')
  if (preview.imageUrl) okBits.push('이미지')
  return (
    <div className="field-help">
      {okBits.length > 0
        ? `자동으로 가져온 항목: ${okBits.join(', ')}. 한 번 확인 후 냉각을 시작하세요.`
        : '상품 정보를 가져오지 못했어요. 직접 입력해 주세요.'}
    </div>
  )
}

function DuplicateNotice({
  duplicateId,
  acknowledged,
  onAck,
}: {
  duplicateId: string
  acknowledged: boolean
  onAck: () => void
}) {
  return (
    <div
      className="flex flex-col gap-2 px-6 py-4"
      style={{
        borderBottom: '2px solid var(--line-default)',
        background: 'var(--accent-soft)',
      }}
    >
      <div className="text-sm font-semibold">이미 담은 적 있는 링크예요.</div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/cooling/${duplicateId}`}
          className="inline-flex items-center border-2 border-[var(--line-default)] bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white"
        >
          기존 항목 보기
        </Link>
        {!acknowledged ? (
          <button
            type="button"
            onClick={onAck}
            className="inline-flex items-center border-2 border-[var(--line-default)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]"
          >
            그래도 새로 담기
          </button>
        ) : (
          <span
            className="inline-flex items-center px-3 text-xs"
            style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}
          >
            새로 담는 중
          </span>
        )}
      </div>
    </div>
  )
}

function PlatformGuide() {
  // SSR과 일치시키기 위해 'paste'로 시작한 뒤 마운트 후 UA로 보정한다.
  const [tab, setTab] = useState<'ios' | 'android' | 'paste'>('paste')

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent
    const next: 'ios' | 'android' | 'paste' = /iPad|iPhone|iPod/.test(ua)
      ? 'ios'
      : /Android/i.test(ua)
        ? 'android'
        : 'paste'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(next)
  }, [])

  return (
    <section className="border-2 border-[var(--line-default)] bg-white">
      <header
        className="flex items-center gap-2 border-b-2 px-4 py-3"
        style={{ borderColor: 'var(--line-default)' }}
      >
        <span className="doc-tag">SETUP</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
          }}
        >
          다음부터 더 빠르게 담기
        </span>
      </header>

      <div className="flex border-b-2" style={{ borderColor: 'var(--line-default)' }}>
        <GuideTab active={tab === 'ios'} onClick={() => setTab('ios')} label="iPhone" />
        <GuideTab active={tab === 'android'} onClick={() => setTab('android')} label="Android" />
        <GuideTab active={tab === 'paste'} onClick={() => setTab('paste')} label="붙여넣기" />
      </div>

      <div className="px-5 py-5 text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
        {tab === 'ios' && <IosGuide />}
        {tab === 'android' && <AndroidGuide />}
        {tab === 'paste' && <PasteGuide />}
      </div>
    </section>
  )
}

function GuideTab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 px-4 py-2 text-xs font-semibold transition-colors"
      style={{
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        background: active ? 'var(--ink)' : 'var(--surface)',
        color: active ? 'var(--surface)' : 'var(--ink-3)',
        borderRight: '2px solid var(--line-default)',
      }}
    >
      {label}
    </button>
  )
}

function IosGuide() {
  return (
    <div className="flex flex-col gap-3">
      <p>
        아이폰 공유 메뉴에 <strong>쿨링오프 담기</strong> 버튼을 추가하세요. 앱
        설치 없이 단축어로 연결합니다.
      </p>
      <ol className="ml-4 list-decimal space-y-1">
        <li>아래 단축어 추가 버튼을 누릅니다.</li>
        <li>iOS 단축어 앱에서 <strong>추가</strong>를 누릅니다.</li>
        <li>
          쇼핑 앱 또는 Safari에서 공유 버튼을 눌러
          <strong> 쿨링오프에 담기</strong>를 선택합니다.
        </li>
      </ol>
      <div>
        <a
          href="/capture/shortcut"
          className="inline-flex items-center border-2 border-[var(--line-default)] bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white"
        >
          단축어 추가 안내 보기 →
        </a>
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 12 }}>
        단축어는 URL만 쿨링오프 웹으로 전달합니다. 로그인 정보는 단축어에
        저장되지 않습니다.
      </p>
    </div>
  )
}

function AndroidGuide() {
  return (
    <div className="flex flex-col gap-3">
      <p>
        Android Chrome에서는 쿨링오프를 <strong>설치</strong>하면 공유 메뉴에
        쿨링오프가 표시됩니다.
      </p>
      <ol className="ml-4 list-decimal space-y-1">
        <li>Chrome 메뉴(⋮)에서 <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 누릅니다.</li>
        <li>
          쇼핑 앱에서 공유 버튼을 눌러 <strong>쿨링오프</strong>를 선택합니다.
        </li>
        <li>받은 URL은 자동으로 캡처 화면으로 들어옵니다.</li>
      </ol>
      <p style={{ color: 'var(--ink-3)', fontSize: 12 }}>
        설치되지 않은 경우 공유 대상에 뜨지 않을 수 있습니다. 그럴 때는 URL을
        직접 붙여넣어 주세요.
      </p>
    </div>
  )
}

function PasteGuide() {
  return (
    <div className="flex flex-col gap-3">
      <p>
        어떤 환경에서든 상품 링크를 복사해서 위 입력창에 붙여넣고{' '}
        <strong>상품 정보 가져오기</strong>를 누르면 됩니다.
      </p>
      <p style={{ color: 'var(--ink-3)', fontSize: 12 }}>
        가능한 경우 상품명/가격을 자동으로 채웁니다. 사이트가 자동 읽기를 막거나
        지원 밖이면, 링크는 그대로 저장하고 이름·가격만 직접 입력하면 됩니다.
      </p>
    </div>
  )
}
