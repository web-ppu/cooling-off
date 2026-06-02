'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerItem } from '@/app/register/actions'
import { getCoolingDaysLabel, COOLING_TIERS } from '@/lib/cooling'
import { formatKRW } from '@/lib/format'

export default function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  /**
   * 등록 완료 splash 노출용. true 가 되면 RegisterForm 자리에 m-splash-card 표시,
   * 1.8초 후 router.push('/').
   * 시안 CoolingStartSplash / PcCoolingStartSplash 흐름 정합.
   */
  const [showStartSplash, setShowStartSplash] = useState(false)

  const priceNum = parseInt(price.replace(/[^\d]/g, '') || '0', 10)
  const priceDisplay = price === '' ? '' : priceNum.toLocaleString('ko-KR')

  // 검증
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

  const valid = !nameErr && !priceErr && !reasonErr && price !== ''

  const cooling = priceNum >= 1 ? getCoolingDaysLabel(priceNum) : null
  const activeTierIdx = COOLING_TIERS.findIndex(
    (t) => priceNum >= t.min && priceNum < t.max
  )

  function blur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
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
    formData.set('url', url)
    formData.set('reason', reason)

    setServerError(null)
    startTransition(async () => {
      try {
        const result = await registerItem(formData)
        if (result && !result.success) {
          setServerError(result.error)
          return
        }
        // 시안 CoolingStartSplash 흐름 — 1.8초 splash 후 홈으로.
        setShowStartSplash(true)
        window.setTimeout(() => {
          router.push('/')
        }, 1800)
      } catch (err) {
        console.error('[register]', err)
        setServerError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  // 등록 완료 splash — 모든 폼/사이드바 대체 (시안 PcCoolingStartSplash / CoolingStartSplash).
  if (showStartSplash) {
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 0',
        }}
      >
        <div className="m-splash-card">
          <div className="m-splash-tags">
            <span className="doc-tag" style={{ background: 'var(--accent)' }}>
              COOLING
            </span>
            <span className="doc-tag">STARTED</span>
          </div>
          <h2>냉각 시작</h2>
          <div className="m-splash-time">{cooling ?? '— —'} 후</div>
          <p>다시 만나요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pc-form-grid">
      {/* 폼 */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="doc-form">
          {/* A: 이름 */}
          <div className="doc-row">
            <div className="doc-row-num">A</div>
            <div className="doc-row-body">
              <div className="doc-row-label">NAME · 이름</div>
              <input
                className="field-input"
                placeholder="예: 에어팟 프로3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => blur('name')}
                maxLength={50}
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
              </div>
              <input
                className="field-input"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                placeholder="0"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceChange}
                onBlur={() => blur('price')}
                disabled={isPending}
              />
              {touched.price && priceErr && (
                <div className="field-error">{priceErr}</div>
              )}
            </div>
          </div>

          {/* C: URL */}
          <div className="doc-row">
            <div className="doc-row-num">C</div>
            <div className="doc-row-body">
              <div className="doc-row-label">
                URL · 링크 <span className="opt">(선택)</span>
              </div>
              <input
                className="field-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
              />
              {url && !url.startsWith('http://') && !url.startsWith('https://') && (
                <div className="field-help">링크 형식을 확인해 주세요</div>
              )}
            </div>
          </div>

          {/* D: 사고 싶은 이유 */}
          <div className="doc-row" style={{ borderBottom: 'none' }}>
            <div className="doc-row-num accent">D</div>
            <div className="doc-row-body">
              <div className="doc-row-label">
                REASON · 사고 싶은 이유 <span className="opt">(선택)</span>
              </div>
              <textarea
                className="field-textarea"
                placeholder="왜 사고 싶은지 적어 주세요. AI 채팅의 출발점이 됩니다."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                disabled={isPending}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="field-help">
                  {reasonErr || '비워둬도 괜찮습니다'}
                </span>
                <span className="field-help" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {reason.length}/200
                </span>
              </div>
            </div>
          </div>

          {/* 하단 제출 */}
          <div className="doc-form-foot">
            <span
              className="doc-meta-row doc-form-foot-sign"
              style={{ borderTop: 'none', padding: 0, margin: 0 }}
            >
              SIGN · _________________
            </span>
            <div className="doc-form-foot-actions flex gap-2.5">
              {/* 디자이너 시안 정합: prototype .btn padding 12/18, font 14.5 */}
              <a
                href="/"
                className="inline-flex items-center justify-center border-2 border-[var(--line-default)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                style={{
                  padding: '12px 18px',
                  fontSize: '14.5px',
                  fontWeight: 500,
                }}
              >
                취소
              </a>
              {/* 디자이너 시안 정합 — accent 파란 배경 + 검정 보더 + 검정 글씨.
                  disabled 상태에서는 opacity 만 떨어지므로 시안의 옅은 회색 톤과 비슷. */}
              <button
                type="submit"
                disabled={!valid || isPending}
                className="inline-flex items-center justify-center border-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--ink)',
                  borderColor: 'var(--ink)',
                  padding: '12px 18px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                }}
              >
                {isPending ? '등록 중…' : '냉각 시작 →'}
              </button>
            </div>
          </div>
        </div>

        {/* 서버 오류 */}
        {serverError && (
          <div
            className="mt-3 border-2 border-[var(--danger)] px-4 py-3 text-sm"
            style={{ color: 'var(--danger)' }}
          >
            {serverError}
          </div>
        )}
      </form>

      {/* 냉각 기간 정보 사이드바 */}
      <aside className="pc-cooling-info">
        <div className="cooling-info-head">
          <span className="doc-tag">SPEC</span>
          <span
            className="doc-meta-row"
            style={{ borderTop: 'none', padding: 0, margin: 0 }}
          >
            EST.
          </span>
        </div>
        <div className="cooling-info-big">
          {cooling ?? '— —'}
        </div>
        <div className="cooling-info-sub">
          {priceNum >= 1
            ? `${formatKRW(priceNum)} 기준`
            : '가격을 입력하면 표시됩니다'}
        </div>
        <div className="cooling-info-table">
          <div className="cooling-info-table-head">
            <span>BAND</span>
            <span>RANGE</span>
            <span>WAIT</span>
          </div>
          {COOLING_TIERS.map((tier, i) => (
            <div
              key={i}
              className={'cooling-info-row' + (i === activeTierIdx ? ' active' : '')}
            >
              <span className="cooling-info-band">0{i + 1}</span>
              <span>{tier.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{tier.days}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
