'use client'

import { useState, useTransition } from 'react'
import { registerItem } from '@/app/register/actions'
import { getCoolingDaysLabel, COOLING_TIERS } from '@/lib/cooling'
import { formatKRW } from '@/lib/format'

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
        }
      } catch (err) {
        // 네트워크 단절, 서버 액션 자체 실패 등 — Next.js redirect()는 여기 도달하지 않음
        console.error('[register]', err)
        setServerError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
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
              className="doc-meta-row"
              style={{ borderTop: 'none', padding: 0, margin: 0 }}
            >
              SIGN · _________________
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium border-2 border-[var(--line-default)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              >
                취소
              </a>
              <button
                type="submit"
                disabled={!valid || isPending}
                className="inline-flex items-center px-5 py-2 text-sm font-semibold bg-[var(--ink)] text-white border-2 border-[var(--line-default)] hover:bg-[var(--ink-2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
            <span>NO</span>
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
