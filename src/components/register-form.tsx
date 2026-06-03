'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerItem } from '@/app/register/actions'
import { getCoolingDaysLabel } from '@/lib/cooling'
import { formatKRW } from '@/lib/format'

/**
 * 사고 싶은 물건 등록 화면 — 시안 RegisterScreen(모바일) 정합.
 *
 * 전체화면: 상단 바(뒤로 + "등록") + "사고 싶은 물건 등록" m-doc-header +
 * 폼(이름/가격/링크/사고 싶은 이유) + 가격 입력 시 m-guide-card(자동 냉각기) +
 * 하단 풀폭 "냉각 시작 →" 바. 등록 완료 시 냉각 시작 splash(전체화면) 노출.
 */
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
   * 등록 완료 splash 노출용. true 가 되면 냉각 시작 splash 표시, 1.8초 후 홈으로.
   * 시안 CoolingStartSplash 흐름 정합.
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

  function blur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPrice(e.target.value.replace(/[^\d]/g, ''))
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

  // 등록 완료 — 냉각 시작 splash (전체화면, 시안 CoolingStartSplash 정합).
  if (showStartSplash) {
    return (
      <div className="register-screen">
        <div className="splash" role="status">
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
          <button
            type="button"
            className="splash-home-btn"
            onClick={() => router.push('/')}
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const urlInvalid =
    url.length > 0 && !url.startsWith('http://') && !url.startsWith('https://')

  return (
    <div className="register-screen">
      {/* 상단 바 — 시안 HeaderBar: 좌측 뒤로 + 가운데 "등록" */}
      <header className="register-head">
        <Link href="/" className="register-back" aria-label="뒤로">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <span className="register-head-title">등록</span>
      </header>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div className="register-body">
          <div className="register-pad">
            <div className="m-doc-header">
              <h1 className="m-doc-title">
                사고 싶은 물건
                <br />
                <span className="doc-title-em">등록</span>
              </h1>
              <div className="m-doc-meta" />
            </div>

            <div className="register-fields">
              {/* 이름 */}
              <div className="field">
                <label className="field-label">이름</label>
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

              {/* 가격 */}
              <div className="field">
                <label className="field-label">
                  가격 <span className="opt">(₩)</span>
                </label>
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

              {/* 링크 */}
              <div className="field">
                <label className="field-label">
                  링크 <span className="opt">(선택)</span>
                </label>
                <input
                  className="field-input"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isPending}
                />
                {urlInvalid && (
                  <div className="field-help">링크 형식을 확인해 주세요</div>
                )}
              </div>

              {/* 사고 싶은 이유 */}
              <div className="field">
                <label className="field-label">
                  사고 싶은 이유 <span className="opt">(선택)</span>
                </label>
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
                    {reasonErr || '사고 싶은 이유는 비어 있어도 괜찮습니다'}
                  </span>
                  <span
                    className="field-help"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {reason.length}/200
                  </span>
                </div>
              </div>

              {/* 가격 입력 시 — 자동 냉각기 안내 카드 (시안 m-guide-card) */}
              {cooling && (
                <div className="m-guide-card">
                  <span
                    className="doc-tag"
                    style={{ background: 'var(--accent)' }}
                  >
                    AUTO
                  </span>
                  <div className="m-guide-body">
                    <div
                      className="m-guide-row"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <span>{formatKRW(priceNum)}</span>
                      <span className="m-guide-arrow">→</span>
                      <strong>{cooling}</strong>
                    </div>
                    <div className="m-guide-sub">
                      가격에 따라 냉각기가 자동 결정됩니다.
                    </div>
                  </div>
                </div>
              )}

              {/* 서버 오류 */}
              {serverError && (
                <div
                  role="alert"
                  className="field-error"
                  style={{
                    border: '2px solid var(--danger)',
                    padding: '8px 12px',
                    marginTop: 0,
                  }}
                >
                  {serverError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 — 풀폭 "냉각 시작" 바 (시안 fixed-bottom) */}
        <div className="register-foot">
          <button
            type="submit"
            className="register-submit"
            disabled={!valid || isPending}
          >
            {isPending ? '등록 중…' : '냉각 시작 →'}
          </button>
        </div>
      </form>
    </div>
  )
}
